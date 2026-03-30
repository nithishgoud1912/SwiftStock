"use server";

import { ratelimit } from "@/lib/ratelimit";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { resend } from "@/app/lib/resend";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import {
  adjustStockSchema,
  addProductSchema,
  updateProductSchema,
  entityIdSchema,
  paginationSchema,
} from "@/lib/validations";
import crypto from "crypto";
import { canPerformAction } from "../permissions";

// Helper to fire actual HTTP requests to registered webhooks
async function dispatchWebhooks(organizationId: string, payload: any) {
  try {
    const webhooks = await prisma.webhookConfig.findMany({
      where: { organizationId, isActive: true },
    });

    for (const hook of webhooks) {
      if (!hook.events.includes("*") && !hook.events.includes(payload.event))
        continue;

      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (hook.secret) {
        const signature = crypto
          .createHmac("sha256", hook.secret)
          .update(body)
          .digest("hex");
        headers["x-swiftstock-signature"] = signature;
      }

      fetch(hook.url, { method: "POST", headers, body }).catch((err) => {
        console.error(`[Webhook] Failed to dispatch to ${hook.url}:`, err);
      });
    }
  } catch (err) {
    console.error("[Webhook] dispatchWebhooks error:", err);
  }
}

async function dispatchAlertsIfLowStock(product: any, userId: string) {
  if (product.quantity <= product.lowStockThreshold) {
    const activeAlertCount = await prisma.lowStockAlert.count({
      where: { productId: product.id, notified: true },
    });

    if (activeAlertCount > 0) {
      const adminUser = await prisma.user.findUnique({ where: { id: userId } });
      const org = await prisma.organization.findUnique({
        where: { id: product.organizationId },
        select: { subscriptionTier: true },
      });

      if (adminUser?.email && org?.subscriptionTier === "PRO") {
        try {
          await resend.emails.send({
            from: "SwiftStock Alerts <onboarding@resend.dev>",
            to: adminUser.email,
            subject: `Action Required: Low Stock for ${product.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d97706;">⚠️ Low Stock Alert</h2>
                <p>Warning: You are running out of <strong>${product.name}</strong> (SKU: ${product.sku}).</p>
                <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 0;">You only have <span style="font-size: 1.25rem; font-weight: bold; color: #b45309;">${product.quantity}</span> left in stock.</p>
                  <p style="margin: 4px 0 0 0; color: #78350f; font-size: 0.875rem;">(Threshold: ${product.lowStockThreshold})</p>
                </div>
                <p>Please log in to your SwiftStock dashboard and reorder immediately to avoid stockouts.</p>
                <hr style="border: 1px solid #f3f4f6; margin: 24px 0;" />
                <p style="color: #6b7280; font-size: 0.75rem;">Automated alert from your SwiftStock application.</p>
              </div>
            `,
          });
        } catch (error) {}
      }

      // 🚨 TRIGGER DEVELOPER WEBHOOKS
      dispatchWebhooks(product.organizationId, {
        event: "stock.low",
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          threshold: product.lowStockThreshold,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export async function getDashboardData() {
  const organizationId = await getAuthorizedOrgId();

  const getCachedData = unstable_cache(
    async () => {
      const products = await prisma.product.findMany({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      });

      const plainProducts = products.map((p: any) => ({
        ...p,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
      }));

      const lowStockItems = plainProducts.filter(
        (p: any) => p.quantity <= p.lowStockThreshold,
      );

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { currency: true },
      });

      return {
        products: plainProducts,
        lowStockCount: lowStockItems.length,
        totalItems: plainProducts.reduce((acc: any, p: any) => acc + p.quantity, 0),
        currency: org?.currency || "INR",
      };
    },
    [`dashboard-${organizationId}`],
    {
      tags: [`inventory-${organizationId}`],
      revalidate: 3600, // Revalidate every hour regardless
    },
  );

  return getCachedData();
}

/**
 * Paginated inventory query for the InventoryTable.
 * Supports cursor-based pagination with optional search, status, and category filters.
 */
export async function getInventoryProducts(params?: {
  cursor?: string;
  take?: number;
  search?: string;
  status?: "ALL" | "IN_STOCK" | "LOW_STOCK";
  categoryId?: string;
}) {
  const organizationId = await getAuthorizedOrgId();
  const take = params?.take ?? 25;
  const cursor = params?.cursor;
  const search = params?.search?.trim();
  const status = params?.status ?? "ALL";
  const categoryId =
    params?.categoryId && params.categoryId !== "ALL"
      ? params.categoryId
      : undefined;

  const getCachedProducts = unstable_cache(
    async () => {
      // Build dynamic where clause
      const where: any = { organizationId };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: take + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      });

      // Apply status filter in-memory
      let filtered = products.map((p: any) => ({
        ...p,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
      }));

      if (status === "LOW_STOCK") {
        filtered = filtered.filter((p: any) => p.quantity <= p.lowStockThreshold);
      } else if (status === "IN_STOCK") {
        filtered = filtered.filter((p: any) => p.quantity > p.lowStockThreshold);
      }

      let nextCursor: string | undefined = undefined;
      if (products.length > take) {
        const nextItem = products.pop();
        nextCursor = nextItem!.id;
      }

      return {
        products: filtered.slice(0, take),
        nextCursor,
      };
    },
    [`inventory-query-${organizationId}`, JSON.stringify(params)],
    {
      tags: [`inventory-${organizationId}`],
      revalidate: 3600,
    },
  );

  return getCachedProducts();
}

export async function adjustStock(
  productId: string,
  quantityChange: number,
  type: "IN" | "OUT",
) {
  const validated = adjustStockSchema.parse({
    productId,
    quantityChange,
    type,
  });
  const { userId, orgRole, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { success: rateLimitOk } = await ratelimit.limit(userId);
  if (!rateLimitOk)
    throw new Error("Too many requests. Please try again later.");

  const productInfo = await prisma.product.findUnique({
    where: { id: productId },
    select: { organizationId: true },
  });
  if (!productInfo) throw new Error("Product not found");

  const permCheck = await canPerformAction(
    productInfo.organizationId,
    "TRANSACTION",
  );
  if (!permCheck.allowed) {
    throw new Error(permCheck.reason);
  }

  const requiresApproval = orgId ? orgRole !== "org:admin" : false;

  if (requiresApproval) {
    await prisma.inventoryAdjustment.create({
      data: {
        productId,
        requestedById: userId,
        quantityChange: type === "IN" ? quantityChange : -quantityChange,
        reason: type === "IN" ? "Stock added" : "Stock removed",
        status: "PENDING",
      },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/approvals");
    return {
      status: "PENDING",
      message: "Stock adjustment submitted for manager approval.",
    };
  }

  const product = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        quantity: {
          increment: type === "IN" ? quantityChange : -quantityChange,
        },
        updatedAt: new Date(),
      },
    });

    // Guard: Prevent negative stock — rolls back the entire transaction
    if (updatedProduct.quantity < 0) {
      throw new Error(
        `Insufficient stock. Cannot remove ${quantityChange} units (only ${updatedProduct.quantity + quantityChange} available).`,
      );
    }

    await tx.stockTransaction.create({
      data: {
        productId,
        userId,
        quantity: quantityChange,
        type,
        notes: type === "IN" ? "Stock added" : "Stock removed",
      },
    });

    await tx.organization.update({
      where: { id: updatedProduct.organizationId },
      data: { dailyTxCount: { increment: 1 } },
    });

    // Smart Low Stock Alert handling
    if (updatedProduct.quantity <= updatedProduct.lowStockThreshold) {
      // Create alert only if there isn't an active one already
      const activeAlert = await tx.lowStockAlert.findFirst({
        where: { productId: updatedProduct.id, resolvedAt: null },
      });
      if (!activeAlert) {
        await tx.lowStockAlert.create({
          data: { productId: updatedProduct.id, notified: true },
        });

        // 🚨 MOCK EMAIL ALERT: Create an EmailNotification record
        await tx.emailNotification.create({
          data: {
            userId: userId,
            organizationId: updatedProduct.organizationId,
            eventType: "LOW_STOCK_ALERT",
            subject: `Action Required: Low Stock for ${updatedProduct.name}`,
            body: `Warning: You are running out of ${updatedProduct.name} (SKU: ${updatedProduct.sku}). You only have ${updatedProduct.quantity} left in stock (Threshold: ${updatedProduct.lowStockThreshold}). Please reorder immediately to avoid stockouts.`,
            status: "PENDING_DELIVERY", // Represents an email waiting to be dispatched by a cron worker or webhooks
          },
        });
      }
    } else {
      // Resolve any active alerts since stock is back to normal
      await tx.lowStockAlert.updateMany({
        where: { productId: updatedProduct.id, resolvedAt: null },
        data: { resolvedAt: new Date() },
      });
    }

    return updatedProduct;
  });

  // Invalidate caches
  revalidateTag(`inventory-${product.organizationId}`, "default");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/approvals");

  // DISPATCH Outside of Transaction to prevent connection pool exhaustion
  await dispatchAlertsIfLowStock(product, userId);

  revalidatePath("/dashboard", "layout");
  return product;
}

export async function lowStockProducts() {
  const organizationId = await getAuthorizedOrgId();
  const products = await prisma.product.findMany({
    where: { organizationId },
  });
  return products
    .filter((p: any) => p.quantity <= p.lowStockThreshold)
    .sort((a: any, b: any) => a.quantity - b.quantity);
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
  imageUrl,
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
  imageUrl?: string;
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
        imageUrl,
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

    // Smart Low Stock Alert handling for initial creation
    if (newProduct.quantity <= newProduct.lowStockThreshold) {
      await tx.lowStockAlert.create({
        data: { productId: newProduct.id, notified: true },
      });
      await tx.emailNotification.create({
        data: {
          userId: userId,
          organizationId: newProduct.organizationId,
          eventType: "LOW_STOCK_ALERT",
          subject: `Action Required: Low Stock for ${newProduct.name}`,
          body: `Warning: You are running out of ${newProduct.name} (SKU: ${newProduct.sku}). You only have ${newProduct.quantity} left in stock (Threshold: ${newProduct.lowStockThreshold}). Please reorder immediately to avoid stockouts.`,
          status: "PENDING_DELIVERY",
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

    revalidatePath("/dashboard", "layout");

    return newProduct;
  });
}

export async function addProductAction(data: {
  name: string;
  sku: string;
  categoryId: string;
  description?: string;
  quantity: number;
  lowStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
}) {
  const validated = addProductSchema.parse(data);
  const { userId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { success } = await ratelimit.limit(userId);

  if (!success) {
    throw new Error("Too many requests. Please try again later.");
  }

  const activeOrgId = await getAuthorizedOrgId();

  const permCheck = await canPerformAction(activeOrgId, "ADD_PRODUCT");
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.reason };
  }

  const user = await currentUser();
  const fn = user?.firstName && user.firstName !== "null" ? user.firstName : "";
  const ln = user?.lastName && user.lastName !== "null" ? user.lastName : "";
  const userName = `${fn} ${ln}`.trim() || "Unknown User";
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

  if (!data.categoryId)
    return { success: false, error: "Please select a category." };

  try {
    const product = await createProduct({
      ...data,
      organizationId: activeOrgId,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl,
      userId: userId,
      userName: userName,
      initialQuantity: data.quantity,
    });

    revalidateTag(`inventory-${activeOrgId}`, "default");
    revalidatePath("/dashboard", "layout");

    await dispatchAlertsIfLowStock(product, userId);

    return { success: true, product };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "A product with this SKU already exists.",
      };
    }

    return { success: false, error: "An unexpected error occurred." };
  }
}

// Fetch unresolved low stock alerts for the notification bell
export async function getLowStockAlerts() {
  const organizationId = await getAuthorizedOrgId();
  return prisma.lowStockAlert.findMany({
    where: {
      resolvedAt: null,
      product: {
        organizationId,
      },
    },
    include: {
      product: {
        select: {
          name: true,
          sku: true,
          quantity: true,
          lowStockThreshold: true,
        },
      },
    },
    orderBy: {
      triggeredAt: "desc",
    },
  });
}

export async function updateProductAction(
  productId: string,
  data: {
    name: string;
    sku: string;
    categoryId: string;
    description?: string;
    costPrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
    imageUrl?: string;
  },
) {
  entityIdSchema.parse(productId);
  const validated = updateProductSchema.parse(data);
  const { userId, orgId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgId && orgRole !== "org:admin")
    return { success: false, error: "Only Admins can edit products." };

  const { success: rateLimitOk } = await ratelimit.limit(userId);
  if (!rateLimitOk)
    return {
      success: false,
      error: "Too many requests. Please try again later.",
    };

  const activeOrgId = orgId || userId;

  const permCheck = await canPerformAction(activeOrgId, "UPDATE_STOCK");
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.reason };
  }

  const user = await currentUser();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : "Unknown";

  try {
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data,
      });

      await tx.organization.update({
        where: { id: activeOrgId },
        data: { dailyUpdateCount: { increment: 1 } },
      });

      if (product.quantity <= product.lowStockThreshold) {
        const activeAlert = await tx.lowStockAlert.findFirst({
          where: { productId: product.id, resolvedAt: null },
        });
        if (!activeAlert) {
          await tx.lowStockAlert.create({
            data: { productId: product.id, notified: true },
          });
          await tx.emailNotification.create({
            data: {
              userId: userId,
              organizationId: product.organizationId,
              eventType: "LOW_STOCK_ALERT",
              subject: `Action Required: Low Stock for ${product.name}`,
              body: `Warning: You are running out of ${product.name} (SKU: ${product.sku}). You only have ${product.quantity} left in stock (Threshold: ${product.lowStockThreshold}). Please reorder immediately to avoid stockouts.`,
              status: "PENDING_DELIVERY",
            },
          });
        }
      } else {
        await tx.lowStockAlert.updateMany({
          where: { productId: product.id, resolvedAt: null },
          data: { resolvedAt: new Date() },
        });
      }
      // Log the edit
      await tx.auditLog.create({
        data: {
          organizationId: activeOrgId,
          userId,
          userName: userName,
          action: "UPDATE",
          entityType: "PRODUCT",
          entityId: product.id,
          changes: data,
        },
      });
      return product;
    });

    revalidateTag(`inventory-${activeOrgId}`, "default" as any);
    revalidatePath("/dashboard", "layout");

    await dispatchAlertsIfLowStock(updatedProduct, userId);

    return { success: true, product: updatedProduct };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "A product with this SKU already exists.",
      };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteProductAction(productId: string) {
  entityIdSchema.parse(productId);
  const { userId, orgId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgId && orgRole !== "org:admin")
    return { success: false, error: "Only Admins can delete products." };

  const { success: rateLimitOk } = await ratelimit.limit(userId);
  if (!rateLimitOk)
    return {
      success: false,
      error: "Too many requests. Please try again later.",
    };
  const user = await currentUser();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : "Unknown";
  const activeOrgId = orgId || userId;
  const result = await prisma.$transaction(async (tx) => {
    // 1. Just delete the actual product! Prisma's Cascade Delete handles the rest automatically!
    const deletedProduct = await tx.product.delete({
      where: { id: productId },
    });
    // 2. Log the deletion
    await tx.auditLog.create({
      data: {
        organizationId: activeOrgId,
        userId,
        userName: userName,
        action: "DELETE",
        entityType: "PRODUCT",
        entityId: productId,
        changes: { name: deletedProduct.name, sku: deletedProduct.sku },
      },
    });
    return { success: true };
  });

  revalidateTag(`inventory-${activeOrgId}`, "default");
  revalidatePath("/dashboard", "layout");

  return result;
}

export async function bulkDeleteProductsAction(productIds: string[]) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgId && orgRole !== "org:admin")
    return { success: false, error: "Only Admins can delete products." };

  const { success: rateLimitOk } = await ratelimit.limit(userId);
  if (!rateLimitOk)
    return {
      success: false,
      error: "Too many requests. Please try again later.",
    };

  const activeOrgId = orgId || userId;
  const user = await currentUser();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : "Unknown";

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the products first so we can log their names/SKUs
      const productsToDelete = await tx.product.findMany({
        where: { id: { in: productIds }, organizationId: activeOrgId },
      });

      if (productsToDelete.length === 0) {
        throw new Error("No matching products found to delete.");
      }

      // 2. Delete them (Cascade Delete handles related records)
      await tx.product.deleteMany({
        where: { id: { in: productIds }, organizationId: activeOrgId },
      });

      // 3. Log the bulk deletion
      await tx.auditLog.create({
        data: {
          organizationId: activeOrgId,
          userId,
          userName,
          action: "DELETE",
          entityType: "PRODUCT",
          entityId: "BULK",
          changes: {
            count: productsToDelete.length,
            deletedItems: productsToDelete.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
            })),
          },
        },
      });

      return { success: true, count: productsToDelete.length };
    });

    revalidateTag(`inventory-${activeOrgId}`, "default");
    revalidatePath("/dashboard", "layout");

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete products.",
    };
  }
}

export async function getStockTransactions(
  cursor?: string,
  take: number = 20,
  search?: string,
  type?: "ALL" | "IN" | "OUT",
) {
  const validated = paginationSchema.parse({ cursor, take });
  const organizationId = await getAuthorizedOrgId();

  const where: any = {
    product: {
      organizationId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
  };

  if (type && type !== "ALL") {
    where.type = type;
  }
  const transactions = await prisma.stockTransaction.findMany({
    where,
    include: {
      product: {
        select: {
          name: true,
          sku: true,
          category: {
            select: { name: true },
          },
        },
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: take + 1, // Fetch one extra to determine if there is a next page
    cursor: cursor ? { id: cursor } : undefined,
  });

  let nextCursor: typeof cursor | undefined = undefined;
  if (transactions.length > take) {
    const nextItem = transactions.pop(); // Remove the extra item
    nextCursor = nextItem!.id;
  }

  return {
    transactions,
    nextCursor,
  };
}

export async function getRecentActivity() {
  const organizationId = await getAuthorizedOrgId();

  const transactions = await prisma.stockTransaction.findMany({
    where: {
      product: {
        organizationId,
      },
    },
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return transactions;
}

// --- Manager Approval Workflows ---

export async function getPendingAdjustments() {
  const organizationId = await getAuthorizedOrgId();

  return prisma.inventoryAdjustment.findMany({
    where: {
      product: { organizationId },
      status: "PENDING",
    },
    include: {
      product: { select: { name: true, sku: true, quantity: true } },
      requestedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveAdjustment(adjustmentId: string) {
  entityIdSchema.parse(adjustmentId);
  const { userId, orgRole, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgId && orgRole !== "org:admin")
    throw new Error("Unauthorized. Only admins can approve.");

  const product = await prisma.$transaction(async (tx) => {
    const adjustment = await tx.inventoryAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: "APPROVED",
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    const updatedProduct = await tx.product.update({
      where: { id: adjustment.productId },
      data: {
        quantity: { increment: adjustment.quantityChange },
        updatedAt: new Date(),
      },
    });

    await tx.stockTransaction.create({
      data: {
        productId: updatedProduct.id,
        userId: adjustment.requestedById, // Log the original requester
        quantity: Math.abs(adjustment.quantityChange),
        type: adjustment.quantityChange > 0 ? "IN" : "OUT",
        notes: `Approved By Admin. Reason: ${adjustment.reason}`,
      },
    });

    // Check low stock alert after approval
    if (updatedProduct.quantity <= updatedProduct.lowStockThreshold) {
      const activeAlert = await tx.lowStockAlert.findFirst({
        where: { productId: updatedProduct.id, resolvedAt: null },
      });
      if (!activeAlert) {
        await tx.lowStockAlert.create({
          data: { productId: updatedProduct.id, notified: true },
        });
      }
    } else {
      await tx.lowStockAlert.updateMany({
        where: { productId: updatedProduct.id, resolvedAt: null },
        data: { resolvedAt: new Date() },
      });
    }

    return updatedProduct;
  });

  if (product.quantity <= product.lowStockThreshold) {
    const activeAlertCount = await prisma.lowStockAlert.count({
      where: { productId: product.id, notified: true },
    });

    if (activeAlertCount > 0) {
      // 🚨 TRIGGER DEVELOPER WEBHOOKS
      dispatchWebhooks(product.organizationId, {
        event: "stock.low",
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          threshold: product.lowStockThreshold,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/approvals");
  return { success: true };
}

export async function rejectAdjustment(adjustmentId: string) {
  entityIdSchema.parse(adjustmentId);
  const { userId, orgRole, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgId && orgRole !== "org:admin")
    throw new Error("Unauthorized. Only admins can reject.");

  await prisma.inventoryAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: "REJECTED",
      approvedById: userId,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/approvals");
  return { success: true };
}

export async function getAnalyticsData() {
  const organizationId = await getAuthorizedOrgId();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactions = await prisma.stockTransaction.findMany({
    where: {
      product: { organizationId },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      type: true,
      quantity: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date (YYYY-MM-DD)
  const groupedData = transactions.reduce((acc: any, tx: any) => {
    const dateStr = tx.createdAt.toISOString().split("T")[0];
    if (!acc[dateStr]) {
      acc[dateStr] = { date: dateStr, added: 0, removed: 0 };
    }

    if (tx.type === "IN") {
      acc[dateStr].added += tx.quantity;
    } else {
      acc[dateStr].removed += tx.quantity;
    }

    return acc;
  }, {});

  // Convert to array and format dates for the chart
  return Object.values(groupedData).map((item: any) => ({
    ...item,
    // Format "2024-03-15" -> "Mar 15"
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
}

export async function getActiveWebhooksCount() {
  const organizationId = await getAuthorizedOrgId();
  return prisma.webhookConfig.count({
    where: { organizationId, isActive: true },
  });
}
