"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Box,
  XCircle,
  ShieldCheck,
  Loader2,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Organization {
  subscriptionTier: string;
  isSubscribed: boolean;
  razorpaySubId: string | null;
  dailyTxCount: number;
  dailyUpdateCount: number;
  _count?: { products: number };
}

// ─── Feature comparison table ─────────────────────────────────────────────────

const FEATURES = [
  { label: "Products", free: "Max 3", pro: "Unlimited" },
  { label: "Daily Transactions", free: "15 / day", pro: "Unlimited" },
  { label: "Daily Updates", free: "10 / day", pro: "Unlimited" },
  { label: "Low-Stock Email Alerts", free: "❌", pro: "✅" },
  { label: "Developer Webhooks", free: "❌", pro: "✅" },
  { label: "Inventory PDF Reports", free: "✅", pro: "✅" },
  { label: "CSV Import / Export", free: "✅", pro: "✅" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingClient({
  organization,
}: {
  organization: Organization | null;
}) {
  const router = useRouter();
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isPro = organization?.subscriptionTier === "PRO";

  // ── Upgrade flow ─────────────────────────────────────────────────────────

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      // 1. Create a Razorpay subscription on the backend
      const res = await fetch("/api/subscriptions/create", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to initiate checkout");

      const { subscriptionId, key } = data;

      if (!key || !subscriptionId) {
        toast.error(
          "Razorpay keys are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_PLAN_ID to your .env file.",
          { duration: 6000 },
        );
        return;
      }

      // 2. Open the Razorpay Checkout popup
      const options = {
        key,
        subscription_id: subscriptionId,
        name: "SwiftStock",
        description: "PRO Plan — ₹99/month",
        image: "/favicon.ico",
        theme: { color: "#6c47ff" },
        prefill: {}, // Razorpay will auto-fill from subscription
        handler: async (response: any) => {
          // 3. Verify signature server-side after payment succeeds
          try {
            const verifyRes = await fetch("/api/subscriptions/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) throw new Error(verifyData.error);

            toast.success(
              "🎉 Welcome to SwiftStock PRO! Your account has been upgraded.",
              { duration: 5000 },
            );
            router.refresh();
          } catch (verifyErr: any) {
            toast.error(
              `Payment received but verification failed: ${verifyErr.message}. Please contact support.`,
              { duration: 8000 },
            );
          }
        },
        modal: {
          ondismiss: () => {
            toast("Checkout cancelled.", { icon: "ℹ️" });
            setUpgradeLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast.error(
          `Payment failed: ${response.error.description || "Unknown error"}`,
        );
        setUpgradeLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate checkout");
      setUpgradeLoading(false);
    }
  };

  // ── Cancel flow ───────────────────────────────────────────────────────────

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelAtCycleEnd: false }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");

      toast.success("Your subscription has been cancelled. You're now on FREE.", {
        duration: 5000,
      });
      setShowCancelConfirm(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Quota calculations ────────────────────────────────────────────────────

  const productCount = organization?._count?.products ?? 0;
  const txCount = organization?.dailyTxCount ?? 0;
  const updateCount = organization?.dailyUpdateCount ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Current Plan Banner ─────────────────────────────────────── */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          isPro
            ? "border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-900"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }`}
      >
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {isPro ? (
                <BadgeCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CreditCard className="h-6 w-6 text-[#6c47ff]" />
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Current Plan:{" "}
                <span
                  className={
                    isPro ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"
                  }
                >
                  {isPro ? "PRO" : "FREE"}
                </span>
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              {isPro
                ? "You have unlimited access to all SwiftStock features."
                : "You're on the Free tier — limited to 3 products, 15 daily transactions, and 10 daily updates."}
            </p>
            {isPro && organization?.razorpaySubId && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
                Subscription ID: {organization.razorpaySubId}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {!isPro ? (
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="flex items-center gap-2 bg-[#6c47ff] hover:bg-[#5835e0] text-white px-6 py-3 rounded-xl font-semibold shadow-sm shadow-[#6c47ff]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {upgradeLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Opening checkout…
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Upgrade to PRO — ₹99/mo
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
              >
                <XCircle size={16} />
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* ── Cancel confirmation inline ───────────────────────────── */}
        {showCancelConfirm && (
          <div className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 md:px-8 py-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
                  Cancel your PRO subscription?
                </p>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                  Your account will immediately revert to the Free tier. This action
                  cannot be undone.
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {cancelLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Cancelling…
                      </>
                    ) : (
                      "Yes, cancel subscription"
                    )}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelLoading}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Keep my subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Usage Quotas ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Today's Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Products */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 text-sm">
                <Box size={15} /> Products
              </span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {isPro ? "Unlimited" : `${productCount} / 3`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  !isPro && productCount >= 3
                    ? "bg-red-500"
                    : "bg-[#6c47ff]"
                }`}
                style={{
                  width: isPro ? "100%" : `${Math.min((productCount / 3) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Daily Transactions */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                Transactions
              </span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {isPro ? "Unlimited" : `${txCount} / 15`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  !isPro && txCount >= 15 ? "bg-red-500" : "bg-[#6c47ff]"
                }`}
                style={{
                  width: isPro ? "100%" : `${Math.min((txCount / 15) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Daily Updates */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                Stock Updates
              </span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {isPro ? "Unlimited" : `${updateCount} / 10`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  !isPro && updateCount >= 10 ? "bg-red-500" : "bg-[#6c47ff]"
                }`}
                style={{
                  width: isPro
                    ? "100%"
                    : `${Math.min((updateCount / 10) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Plan Comparison ───────────────────────────────────────── */}
      {!isPro && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 md:px-8 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#6c47ff]/5 to-transparent">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              What's in PRO?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Unlock everything for ₹99/month
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {/* Header row */}
            <div className="grid grid-cols-3 px-6 md:px-8 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-[#6c47ff]">PRO</span>
            </div>

            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="grid grid-cols-3 px-6 md:px-8 py-3.5 text-sm items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {f.label}
                </span>
                <span className="text-center text-gray-500 dark:text-gray-400">
                  {f.free}
                </span>
                <span className="text-center font-semibold text-emerald-600 dark:text-emerald-400">
                  {f.pro}
                </span>
              </div>
            ))}
          </div>

          <div className="px-6 md:px-8 py-5 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#6c47ff]/5 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                ₹99
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Billed monthly · Cancel anytime
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="flex items-center gap-2 bg-[#6c47ff] hover:bg-[#5835e0] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm shadow-[#6c47ff]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {upgradeLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Opening checkout…
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Upgrade to PRO
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── PRO active confirmation ───────────────────────────────── */}
      {isPro && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-5 py-4">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <span className="font-semibold">PRO is active.</span> All limits are
            removed. Your subscription renews automatically each month.
          </p>
        </div>
      )}
    </div>
  );
}
