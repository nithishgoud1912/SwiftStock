import type { Metadata } from "next";
import {
  getDashboardData,
  getRecentActivity,
} from "@/app/lib/actions/inventory";
import DashboardWidgets from "@/components/dashboard/DashboardWidgets";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard | SwiftStock",
  description:
    "Overview of your inventory metrics, stock alerts, and recent activity.",
};

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Use orgId if they are in an organization, otherwise their personal userId acts as the tenant
  const activeOrgId = orgId || userId;

  // Fetch data directly from the database because this is a Server Component!
  const dashboardData = await getDashboardData();
  const recentActivity = await getRecentActivity();

  // Fetch a quick count of active webhooks for the status widget
  const activeWebhooksCount = await prisma.webhookConfig.count({
    where: { organizationId: activeOrgId, isActive: true },
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your high-level metrics and latest stock movements.
          </p>
        </div>
      </header>

      {/* Dynamic KPI Cards (Connected to TanStack Query for zero-lag updates) */}
      <DashboardWidgets initialData={dashboardData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Main Content Area: Chart + Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AnalyticsChart />
          <RecentActivityFeed initialData={recentActivity} />
        </div>

        {/* System Overview & Quick Links */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Activity size={20} className="text-[#6c47ff]" />
              System Status
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Database Connection
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${activeWebhooksCount > 0 ? "bg-[#6c47ff] shadow-[0_0_8px_rgba(108,71,255,0.5)]" : "bg-gray-400"}`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Active Webhooks
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {activeWebhooksCount}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <Link
                href="/dashboard/settings/webhooks"
                className="group flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#6c47ff] dark:hover:text-[#8b6fff] transition-colors"
              >
                Configure Integrations
                <ArrowRight
                  size={16}
                  className="transform group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>

          <div className="bg-linear-to-br from-[#6c47ff]/10 to-indigo-500/10 dark:from-[#6c47ff]/20 dark:to-indigo-500/10 rounded-2xl border border-[#6c47ff]/20 dark:border-[#6c47ff]/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">
              Access Control
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 relative z-10 mb-6">
              Manage who has permission to approve transactions and modify
              products.
            </p>
            <Link
              href="/dashboard/settings/organization"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow relative z-10 transition-all border border-gray-200 dark:border-gray-700"
            >
              Manage Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
