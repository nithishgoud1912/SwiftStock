"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDashboardData(organizationId: string) {
  // ... omitting unchanged code but wait, replace file content works by replacing exact target content
  // so I'm doing two replacements ... I'll use multi_replace.

  const products = await prisma.product.findMany({
    where: { organizationId: organizationId },
    orderBy: { updatedAt: "desc" },
  });

  const plainProducts = products.map((p) => ({
    ...p,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
  }));

  const lowStockItems = plainProducts.filter(
    (p) => p.quantity <= p.lowStockThreshold,
  );

  return {
    products: plainProducts,
    lowStockCount: lowStockItems.length,
    totalItems: plainProducts.reduce((acc, p) => acc + p.quantity, 0),
  };
}

export async function adjustStock(
  productId: string,
  quantityChange: number,
  type: "IN" | "OUT",
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: productId },
      data: {
        quantity: {
          increment: type === "IN" ? quantityChange : -quantityChange,
        },
        updatedAt: new Date(),
      },
    });

    await tx.stockTransaction.create({
      data: {
        productId,
        userId,
        quantity: quantityChange,
        type,
        notes: type === "IN" ? "Stock added" : "Stock removed",
      },
    });

    if (product.quantity <= product.lowStockThreshold) {
      await tx.lowStockAlert.create({
        data: {
          productId: product.id,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/inventory");

    return product;
  });
}

export async function lowStockProducts(organizationId: string) {
  return prisma.product.findMany({
    where: {
      organizationId,
      quantity: { lte: 10 },
    },
    orderBy: { quantity: "asc" },
  });
}

export async function createProduct({
  organizationId,
  categoryId,
  name,
  sku,
  description,
  costPrice,
  sellingPrice,
  initialQuantity = 0,
  lowStockThreshold = 10,
  userId, // We need this for the Audit Log
  userName, // Name of the user performing the action
}: {
  organizationId: string;
  categoryId: string;
  name: string;
  sku: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  initialQuantity?: number;
  lowStockThreshold?: number;
  userId: string;
  userName: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Create the Product
    const newProduct = await tx.product.create({
      data: {
        organizationId,
        categoryId,
        name,
        sku,
        description,
        costPrice,
        sellingPrice,
        quantity: initialQuantity,
        lowStockThreshold,
      },
    });

    // 2. If there's initial stock, log it in StockTransaction
    if (initialQuantity > 0) {
      await tx.stockTransaction.create({
        data: {
          productId: newProduct.id,
          userId,
          type: "IN",
          quantity: initialQuantity,
          notes: "Initial stock upon product creation",
        },
      });
    }

    // 3. Create an Audit Log for the overarching action
    await tx.auditLog.create({
      data: {
        organizationId,
        userId,
        userName,
        action: "CREATE",
        entityType: "PRODUCT",
        entityId: newProduct.id,
        changes: { name, sku, initialQuantity }, // Storing minimal JSON payload
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/inventory");

    return newProduct;
  });
}

export async function addProductAction(data: {
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
}) {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const activeOrgId = orgId || userId;
  const user = await currentUser();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Unknown User";
  const userEmail =
    user?.emailAddresses?.[0]?.emailAddress || "unknown@example.com";

  // Upsert user
  await prisma.user.upsert({
    where: { email: userEmail },
    update: { name: userName, id: userId },
    create: {
      id: userId,
      email: userEmail,
      name: userName,
    },
  });

  // Upsert organization (treating userId as orgId if strictly personal)
  await prisma.organization.upsert({
    where: { slug: activeOrgId },
    update: {},
    create: {
      id: activeOrgId,
      name: orgId ? "Organization" : `${userName}'s Workspace`,
      slug: activeOrgId,
    },
  });

  // Upsert a default category for the org
  const category = await prisma.category.upsert({
    where: { id: `default_cat_${activeOrgId}` },
    update: {},
    create: {
      id: `default_cat_${activeOrgId}`,
      name: "General",
      organizationId: activeOrgId,
    },
  });

  try {
    const product = await createProduct({
      ...data,
      organizationId: activeOrgId,
      categoryId: category.id,
      userId: userId,
      userName: userName,
      initialQuantity: data.quantity,
    });
    return { success: true, product };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("sku")) {
      return {
        success: false,
        error: "A product with this SKU already exists.",
      };
    }
    console.error("Failed to add product:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getTransactions(organizationId: string) {
  return prisma.stockTransaction.findMany({
    where: {
      product: {
        organizationId: organizationId,
      },
    },
    include: {
      product: {
        select: { name: true, sku: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
