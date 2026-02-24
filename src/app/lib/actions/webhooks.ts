"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import {
  createWebhookSchema,
  toggleWebhookSchema,
  entityIdSchema,
} from "@/lib/validations";

export async function getWebhooks() {
  const { userId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const organizationId = await getAuthorizedOrgId();

  // Only Admins or Personal Workspace owners can view webhooks
  if (orgRole && orgRole !== "org:admin") {
    throw new Error(
      "Only organization administrators can view webhook configurations.",
    );
  }

  return prisma.webhookConfig.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWebhook(data: { url: string; secret?: string }) {
  const validated = createWebhookSchema.parse(data);
  const { userId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgRole && orgRole !== "org:admin")
    throw new Error("Only admins can create webhooks.");
  const organizationId = await getAuthorizedOrgId();

  try {
    const parsed = new URL(data.url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL must be HTTP/HTTPS");
    }
  } catch (error) {
    return { success: false, error: "Invalid Webhook URL provided." };
  }

  try {
    const webhook = await prisma.webhookConfig.create({
      data: {
        organizationId,
        url: data.url,
        secret: data.secret || undefined,
        events: ["stock.low"], // Default event for MVP
        isActive: true,
      },
    });

    revalidatePath("/dashboard/settings/webhooks");
    return { success: true, webhook };
  } catch (error) {
    return { success: false, error: "Failed to create webhook." };
  }
}

export async function toggleWebhook(id: string, isActive: boolean) {
  toggleWebhookSchema.parse({ id, isActive });
  const { userId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgRole && orgRole !== "org:admin")
    throw new Error("Only admins can modify webhooks.");

  await prisma.webhookConfig.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/dashboard/settings/webhooks");
  return { success: true };
}

export async function deleteWebhook(id: string) {
  entityIdSchema.parse(id);
  const { userId, orgRole } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (orgRole && orgRole !== "org:admin")
    throw new Error("Only admins can delete webhooks.");

  await prisma.webhookConfig.delete({
    where: { id },
  });

  revalidatePath("/dashboard/settings/webhooks");
  return { success: true };
}
