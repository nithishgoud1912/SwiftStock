import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder",
});

export async function POST(req: Request) {
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

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required (ex: plan_xyz123)" },
        { status: 400 },
      );
    }

    // 1. Create a Subscription in Razorpay
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId, // Plan ID created in Razorpay Dashboard for 99/month
      customer_notify: 1, // Razorpay will email the customer
      total_count: 12, // For example, 1 year = 12 months
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      entity: "subscription",
    });
  } catch (error: any) {
    console.error("[RAZORPAY] Create Subscription Error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription", details: error.message },
      { status: 500 },
    );
  }
}
