import { auth } from "@clerk/nextjs/server";

/**
 * Derives the authorized organization ID from the authenticated session.
 * Uses orgId if the user is in an organization, otherwise falls back to userId
 * as a personal workspace identifier.
 *
 * This MUST be used instead of accepting organizationId from client parameters
 * to prevent cross-tenant data access.
 */
export async function getAuthorizedOrgId(): Promise<string> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return orgId || userId;
}

/**
 * Returns the full auth context including role information.
 */
export async function getAuthorizedAuth() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId, orgId, orgRole, activeOrgId: orgId || userId };
}
