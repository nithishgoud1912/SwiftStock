import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "webhook_secret";

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    const event = payload.event;

    if (
      event === "subscription.authenticated" ||
      event === "subscription.activated"
    ) {
      const subscriptionId = payload.payload.subscription.entity.id;
      // In a real app, you would pass the orgId in the subscription 'notes' or map via customer ID.
      // E.g., const orgId = payload.payload.subscription.entity.notes.orgId;
      const notes = payload.payload.subscription.entity.notes || {};
      const orgId = notes.orgId;

      if (orgId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            subscriptionTier: "PRO",
            isSubscribed: true,
            razorpaySubId: subscriptionId,
          },
        });
      } else {
        console.warn("Razorpay Webhook: No orgId found in subscription notes");
      }
    } else if (
      event === "subscription.cancelled" ||
      event === "subscription.halted"
    ) {
      const subscriptionId = payload.payload.subscription.entity.id;
      // Reverse the PRO tier limit
      await prisma.organization.updateMany({
        where: { razorpaySubId: subscriptionId },
        data: {
          subscriptionTier: "FREE",
          isSubscribed: false,
          razorpaySubId: null, // Depending on if we want to store it for history.
        },
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[RAZORPAY WEBHOOK] Error handling event:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
