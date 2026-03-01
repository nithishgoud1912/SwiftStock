import { prisma } from "@/lib/prisma";

export type PermissionAction = "ADD_PRODUCT" | "TRANSACTION" | "UPDATE_STOCK";

export async function canPerformAction(
  organizationId: string,
  action: PermissionAction,
): Promise<{ allowed: boolean; reason?: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  // PRO users have unlimited access
  if (org.subscriptionTier === "PRO") {
    return { allowed: true };
  }

  // FREE tier limits
  switch (action) {
    case "ADD_PRODUCT": {
      const productCount = await prisma.product.count({
        where: { organizationId },
      });
      if (productCount >= 3) {
        return {
          allowed: false,
          reason: "FREE tier limit reached: Maximum 3 products allowed.",
        };
      }
      return { allowed: true };
    }
    case "TRANSACTION": {
      if (org.dailyTxCount >= 15) {
        return {
          allowed: false,
          reason: "FREE tier limit reached: Maximum 15 transactions per day.",
        };
      }
      return { allowed: true };
    }
    case "UPDATE_STOCK": {
      if (org.dailyUpdateCount >= 10) {
        return {
          allowed: false,
          reason: "FREE tier limit reached: Maximum 10 stock updates per day.",
        };
      }
      return { allowed: true };
    }
    default:
      return { allowed: false, reason: "Unknown action" };
  }
}
