import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/subscriptions/cancel
 *
 * Cancels the active Razorpay subscription for the authenticated org
 * and downgrades the org to FREE tier.
 *
 * Body: { cancelAtCycleEnd?: boolean }
 *   cancelAtCycleEnd = true  → cancel at end of current billing period (graceful)
 *   cancelAtCycleEnd = false → cancel immediately (default)
 */
export async function POST(req: Request) {
  try {
    const orgId = await getAuthorizedOrgId();

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { razorpaySubId: true, subscriptionTier: true },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 },
      );
    }

    if (org.subscriptionTier !== "PRO" || !org.razorpaySubId) {
      return NextResponse.json(
        { error: "No active PRO subscription found." },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const cancelAtCycleEnd: boolean = body.cancelAtCycleEnd ?? false;

    // Cancel the Razorpay subscription
    await (razorpay.subscriptions as any).cancel(org.razorpaySubId, cancelAtCycleEnd);

    // Downgrade the org in the database immediately
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionTier: "FREE",
        isSubscribed: false,
        razorpaySubId: null,
      },
    });

    console.log(
      `[RAZORPAY CANCEL] Org ${orgId} downgraded to FREE (sub: ${org.razorpaySubId})`,
    );

    return NextResponse.json({
      success: true,
      message: cancelAtCycleEnd
        ? "Subscription will cancel at the end of the billing period."
        : "Subscription cancelled immediately.",
    });
  } catch (error: any) {
    console.error("[RAZORPAY CANCEL] Error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription.", details: error.message },
      { status: 500 },
    );
  }
}
