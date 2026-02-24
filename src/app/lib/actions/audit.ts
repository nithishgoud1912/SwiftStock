"use server";

import { prisma } from "@/lib/prisma";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import { paginationSchema } from "@/lib/validations";

export async function getAuditLogs(params?: {
  cursor?: string;
  take?: number;
  search?: string;
  action?: string;
  entityType?: string;
}) {
  const organizationId = await getAuthorizedOrgId();

  const take = params?.take ?? 25;
  const cursor = params?.cursor;
  const search = params?.search?.trim();
  const action =
    params?.action && params.action !== "ALL" ? params.action : undefined;
  const entityType =
    params?.entityType && params.entityType !== "ALL"
      ? params.entityType
      : undefined;

  const where: any = { organizationId };

  if (search) {
    where.OR = [
      { userName: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  const auditLogs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  if (auditLogs.length > take) {
    const nextItem = auditLogs.pop();
    nextCursor = nextItem!.id;
  }

  return {
    auditLogs,
    nextCursor,
  };
}
