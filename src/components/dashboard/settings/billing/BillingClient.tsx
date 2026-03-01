"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, CheckCircle2, ShieldAlert, Zap, Box } from "lucide-react";

export default function BillingClient({ organization }: { organization: any }) {
  const [loading, setLoading] = useState(false);
  const isPro = organization?.subscriptionTier === "PRO";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Create Subscription order on backend
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "plan_placeholder", // Provide genuine Razorpay plan_id here
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to create subscription");

      // Ideally trigger generic Razorpay Checkout:
      // const options = {
      //   key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      //   subscription_id: data.subscriptionId,
      //   name: "SwiftStock PRO",
      //   description: "Monthly PRO Subscription",
      //   handler: function (response: any) {
      //     toast.success("Payment successful! Refreshing...");
      //     window.location.reload();
      //   },
      // };
      // const rzp = new (window as any).Razorpay(options);
      // rzp.open();

      toast.success(
        "Subscription checkout initiated. (Mocked because Razorpay API keys are not placed yet).",
        { duration: 4000 },
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CreditCard className="text-[#6c47ff]" />
                Current Plan:{" "}
                <span className={isPro ? "text-emerald-600" : "text-gray-500"}>
                  {isPro ? "PRO" : "FREE"}
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isPro
                  ? "You have unlimited access to all features."
                  : "You are currently on the Free tier. Upgrade to unlock unlimited products and email alerts."}
              </p>
            </div>
            {!isPro && (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-[#6c47ff] hover:bg-[#8b6fff] text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <Zap size={18} /> Upgrade to PRO - ₹99/mo
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quotas & Limits */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 md:p-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Usage Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                  <Box size={16} /> Products
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {isPro ? "Unlimited" : `Max 3`}
                </span>
              </div>
              {!isPro && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-[#6c47ff] h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(((organization?._count?.products || 0) / 3) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {organization?._count?.products || 0} created
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Daily Transactions
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {isPro ? "Unlimited" : `Max 15`}
                </span>
              </div>
              {!isPro && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-[#6c47ff] h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(((organization?.dailyTxCount || 0) / 15) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {organization?.dailyTxCount || 0} executed today
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Daily Updates
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {isPro ? "Unlimited" : `Max 10`}
                </span>
              </div>
              {!isPro && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-[#6c47ff] h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(((organization?.dailyUpdateCount || 0) / 10) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {organization?.dailyUpdateCount || 0} executed today
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
