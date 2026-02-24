import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SIGNUP_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add your WEBHOOK_SECRET to .env");
  }

  const headerPayload = await headers();

  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const webhook = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  try {
    evt = webhook.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("Webhook verified successfully:", evt);
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Invalid webhook signature", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      const {
        email_addresses,
        first_name,
        last_name,
        primary_email_address_id,
        image_url,
      } = evt.data as any;
      const primaryEmail = email_addresses.find(
        (email: any) => email.id === primary_email_address_id,
      );
      if (!primaryEmail) {
        return new Response("Error: Primary email not found", { status: 400 });
      }
      await prisma.user.create({
        data: {
          id,
          email: primaryEmail.email_address,
          name: `${first_name} ${last_name}`,
          avatarUrl: image_url,
        },
      });
    } catch (err) {
      console.error("Error creating user:", err);
      return new Response("Error: Failed to create user", { status: 500 });
    }
  }

  // --- Organization Sync Integration ---
  if (
    eventType === "organization.created" ||
    eventType === "organization.updated"
  ) {
    try {
      const { id: orgId, name, slug } = evt.data as any;
      await prisma.organization.upsert({
        where: { id: orgId },
        update: { name, slug },
        create: { id: orgId, name, slug },
      });
    } catch (err) {
      console.error("Error syncing organization:", err);
      return new Response("Error: Failed to sync organization", {
        status: 500,
      });
    }
  }

  if (eventType === "organization.deleted") {
    try {
      const { id: orgId } = evt.data as any;
      if (orgId) {
        await prisma.organization.delete({ where: { id: orgId } });
      }
    } catch (err) {
      console.error("Error deleting organization:", err);
      return new Response("Error: Failed to delete organization", {
        status: 500,
      });
    }
  }

  // --- Membership Sync Integration ---
  if (eventType === "organizationMembership.created") {
    try {
      const {
        id: membershipId,
        organization,
        public_user_data,
        role,
      } = evt.data as any;

      const userId = public_user_data.user_id;

      // Ensure the User exists in our DB before creating the membership to avoid Foreign Key constraint errors
      if (userId) {
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: public_user_data.identifier || `${userId}@email.com`,
            name:
              `${public_user_data.first_name || ""} ${public_user_data.last_name || ""}`.trim() ||
              "Unknown",
            avatarUrl: public_user_data.image_url || "",
          },
        });
      }

      await prisma.organizationMember.upsert({
        where: { id: membershipId },
        update: { role: role, userId: userId },
        create: {
          id: membershipId,
          organizationId: organization.id,
          userId: userId,
          role: role,
        },
      });
    } catch (err) {
      console.error("Error creating organization membership:", err);
      return new Response("Error: Failed to create membership", {
        status: 500,
      });
    }
  }

  if (eventType === "organizationMembership.deleted") {
    try {
      const { id: membershipId } = evt.data as any;
      if (membershipId) {
        await prisma.organizationMember.delete({ where: { id: membershipId } });
      }
    } catch (err) {
      console.error("Error deleting organization membership:", err);
      return new Response("Error: Failed to delete membership", {
        status: 500,
      });
    }
  }

  if (eventType === "organizationMembership.updated") {
    try {
      const { id: membershipId, role } = evt.data as any;
      await prisma.organizationMember.update({
        where: { id: membershipId },
        data: { role },
      });
    } catch (err) {
      console.error("Error updating organization membership:", err);
      return new Response("Error: Failed to update membership", {
        status: 500,
      });
    }
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
