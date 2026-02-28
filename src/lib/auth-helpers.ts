import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Derives the authorized organization ID from the authenticated session.
 * Uses orgId if the user is in an organization, otherwise falls back to userId
 * as a personal workspace identifier.
 *
 * It will implicitly upsert a "Personal Organization" into Prisma
 * when falling back to userId.
 *
 * This MUST be used instead of accepting organizationId from client parameters
 * to prevent cross-tenant data access.
 */
export async function getAuthorizedOrgId(): Promise<string> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const targetId = orgId || userId;

  // If we are falling back to userId (no active org), ensure a Personal Org exists
  if (!orgId) {
    try {
      await prisma.organization.upsert({
        where: { id: targetId }, // Use only id for where clause
        update: {},
        create: {
          id: targetId,
          name: "Personal Workspace",
          slug: `personal-${targetId}`,
        },
      });
    } catch (err) {
      console.error("[Auth] Failed to upsert Personal Workspace:", err);
    }
  } else {
    // Check if the Clerk org actually exists in Prisma to debug P2003
    const exists = await prisma.organization.findUnique({
      where: { id: orgId! },
    });
    if (!exists) {
      try {
        const client = await clerkClient();
        const clerkOrg = await client.organizations.getOrganization({
          organizationId: orgId,
        });
        await prisma.organization.upsert({
          where: { id: orgId },
          update: {},
          create: {
            id: clerkOrg.id,
            name: clerkOrg.name,
            slug: clerkOrg.slug || `org-${clerkOrg.id}`,
          },
        });
      } catch (err) {
        console.error("[Auth] Failed to sync Clerk org to Prisma:", err);
      }
    }
  }

  return targetId;
}

/**
 * Returns the full auth context including role information.
 */
export async function getAuthorizedAuth() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId, orgId, orgRole, activeOrgId: orgId || userId };
}
