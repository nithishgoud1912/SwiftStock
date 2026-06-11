import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST() {
  try {
    const orgId = await getAuthorizedOrgId();

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    if (org.subscriptionTier === "PRO") {
      return NextResponse.json(
        { error: "Organization is already subscribed to PRO." },
        { status: 400 },
      );
    }

    const planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) {
      return NextResponse.json(
        { error: "RAZORPAY_PLAN_ID is not configured on the server." },
        { status: 500 },
      );
    }

    // Create a Razorpay Subscription.
    // We pass orgId in 'notes' so the webhook can map the payment back to the right org.
    const subscription = await (razorpay.subscriptions as any).create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // 12-month recurring
      notes: {
        orgId, // ← critical: webhook reads this to upgrade the correct org
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("[RAZORPAY] Create Subscription Error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription", details: error.message },
      { status: 500 },
    );
  }
}
