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
        try{
            const { email_addresses, first_name, last_name,primary_email_address_id,image_url } = evt.data as any;
        const primaryEmail = email_addresses.find((email: any) => email.id === primary_email_address_id);
        if(!primaryEmail){
            return new Response("Error: Primary email not found", { status: 400 });
        }
        await prisma.user.create({
            data: {
                id,
                email: primaryEmail.email_address,
                name: `${first_name} ${last_name}`,
                avatarUrl:image_url,
            },
        });
        }catch(err){
            console.error("Error creating user:", err);
            return new Response("Error: Failed to create user", { status: 500 });
        }
    }   

    return new Response("New User Created", { status: 200 });
}