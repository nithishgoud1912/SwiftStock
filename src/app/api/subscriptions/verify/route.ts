import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/subscriptions/verify
 *
 * Called client-side from the Razorpay checkout handler after a successful payment.
 * Verifies the payment signature, then upgrades the org to PRO.
 *
 * Body: { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
 */
export async function POST(req: Request) {
  try {
    const orgId = await getAuthorizedOrgId();

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
      await req.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 },
      );
    }

    // Verify HMAC signature: payment_id + "|" + subscription_id
    const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[RAZORPAY VERIFY] Signature mismatch");
      return NextResponse.json(
        { error: "Invalid payment signature. Possible fraud attempt." },
        { status: 400 },
      );
    }

    // Signature valid — upgrade the org
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionTier: "PRO",
        isSubscribed: true,
        razorpaySubId: razorpay_subscription_id,
      },
    });

    console.log(
      `[RAZORPAY VERIFY] Org ${orgId} upgraded to PRO (sub: ${razorpay_subscription_id})`,
    );

    return NextResponse.json({ success: true, tier: "PRO" });
  } catch (error: any) {
    console.error("[RAZORPAY VERIFY] Error:", error);
    return NextResponse.json(
      { error: "Payment verification failed.", details: error.message },
      { status: 500 },
    );
  }
}
