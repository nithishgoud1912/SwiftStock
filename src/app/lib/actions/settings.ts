"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import {
  createCategorySchema,
  updateCategorySchema,
  entityIdSchema,
  updateOrgProfileSchema,
} from "@/lib/validations";

// ==============================
// Category Management Server Actions
// ==============================

export async function getCategories() {
  const organizationId = await getAuthorizedOrgId();

  const getCachedCategories = unstable_cache(
    async () => {
      const categories = await prisma.category.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      return categories;
    },
    [`categories-${organizationId}`],
    {
      tags: [`categories-${organizationId}`],
      revalidate: 3600,
    },
  );

  return getCachedCategories();
}

export async function createCategory(data: {
  name: string;
  description?: string;
}) {
  const validated = createCategorySchema.parse(data);
  const organizationId = await getAuthorizedOrgId();

  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      organizationId,
    },
  });

  revalidateTag(`categories-${organizationId}`, "default");

  return category;
}

export async function updateCategory(
  id: string,
  data: { name: string; description?: string },
) {
  entityIdSchema.parse(id);
  const validated = updateCategorySchema.parse(data);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  const organizationId = await getAuthorizedOrgId();
  revalidateTag(`categories-${organizationId}`, "default");

  return category;
}

export async function deleteCategory(id: string) {
  entityIdSchema.parse(id);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Prevent deletion if category has products
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(
      `Cannot delete category because it contains ${count} products.`,
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  const organizationId = await getAuthorizedOrgId();
  revalidateTag(`categories-${organizationId}`, "default");

  return { success: true };
}

// ==============================
// Organization Members Sync
// ==============================

import { clerkClient } from "@clerk/nextjs/server";

export async function syncOrganizationMembers() {
  const organizationId = await getAuthorizedOrgId();

  const client = await clerkClient();
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId,
  });

  if (!memberships || !memberships.data) {
    return { success: false, count: 0 };
  }

  // 1. Sync User profiles first to satisfy foreign key constraints
  const usersToUpsert = memberships.data.map((mem: any) => {
    const fn =
      mem.publicUserData?.firstName && mem.publicUserData.firstName !== "null"
        ? mem.publicUserData.firstName
        : "";
    const ln =
      mem.publicUserData?.lastName && mem.publicUserData.lastName !== "null"
        ? mem.publicUserData.lastName
        : "";
    const fullName = `${fn} ${ln}`.trim() || "Unknown User";

    return {
      id: mem.publicUserData?.userId || `unknown_${Date.now()}`,
      email:
        mem.publicUserData?.identifier || `unknown_${Date.now()}@email.com`,
      name: fullName,
      avatarUrl: mem.publicUserData?.imageUrl || "",
    };
  });

  // 2. Sync Memberships
  const membersToUpsert = memberships.data.map((mem: any) => ({
    id: mem.id,
    userId: mem.publicUserData?.userId || "",
    role: mem.role,
    organizationId: organizationId,
  }));

  await prisma.$transaction([
    ...usersToUpsert
      .filter((u: any) => u.id)
      .map((u: any) =>
        prisma.user.upsert({
          where: { id: u.id },
          update: { name: u.name, avatarUrl: u.avatarUrl },
          create: {
            id: u.id,
            email: u.email,
            name: u.name,
            avatarUrl: u.avatarUrl,
          },
        }),
      ),
    ...membersToUpsert
      .filter((m: any) => m.userId)
      .map((mem: any) =>
        prisma.organizationMember.upsert({
          where: { id: mem.id },
          update: { role: mem.role, userId: mem.userId },
          create: mem,
        }),
      ),
  ]);

  return { success: true, count: membersToUpsert.length };
}

export async function getOrganizationMembers() {
  const organizationId = await getAuthorizedOrgId();

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return members;
}

export async function updateOrganizationProfile(data: {
  address?: string | null;
  city?: string | null;
  contact?: string | null;
  logoUrl?: string | null;
}) {
  const validated = updateOrgProfileSchema.parse(data);
  const organizationId = await getAuthorizedOrgId();

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      address: validated.address,
      city: validated.city,
      contact: validated.contact,
      logoUrl: validated.logoUrl,
    },
  });

  revalidatePath("/dashboard/settings/organization");

  return organization;
}
