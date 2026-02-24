import Link from "next/link";
import {
  ArrowRight,
  Box,
  Zap,
  ShieldCheck,
  BarChart3,
  Package,
  Users,
  Bell,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans selection:bg-[#6c47ff]/30 selection:text-[#6c47ff]">
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#6c47ff]/20 dark:bg-[#6c47ff]/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6c47ff]/10 text-[#6c47ff] dark:text-[#8b6fff] text-sm font-semibold mb-8 border border-[#6c47ff]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6c47ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6c47ff]"></span>
            </span>
            SwiftStock MVP is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
            Inventory Management with{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#6c47ff] to-[#9d80ff]">
              Zero Lag
            </span>
            .
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            A minimalist, dashboard-first SaaS built for modern teams. Ditch the
            bloated spreadsheets and slow ERPs. Manage your stock, set low-stock
            alerts, and track transactions instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={userId ? "/dashboard" : "/sign-up"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#6c47ff] hover:bg-[#5a38e8] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl shadow-[#6c47ff]/20 hover:shadow-[#6c47ff]/40 hover:-translate-y-1"
            >
              {userId ? "Return to Dashboard" : "Start Managing for Free"}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all"
            >
              Explore Features
            </Link>
          </div>
        </section>

        {/* What is SwiftStock Section */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-6 py-24 border-t border-gray-200 dark:border-white/10"
        >
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              What is SwiftStock?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              SwiftStock is a lightweight, high-performance inventory management
              system tailored for growing businesses. We strip away the
              complexity of traditional enterprise software to give you exactly
              what you need—speed, accuracy, and ease of use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Package />}
              title="Dashboard-First"
              description="Everything you need is accessible from a unified, modern dashboard. Search, filter, and manage thousands of SKUs instantly."
            />
            <FeatureCard
              icon={<Bell />}
              title="Automated Alerts"
              description="Never run out of stock. Set custom low-stock thresholds and receive real-time email digests and webhook notifications."
            />
            <FeatureCard
              icon={<Users />}
              title="Multi-Tenant RBAC"
              description="Built for teams. Role-based access control ensures only Admins can delete or edit products, while Members can request stock adjustments."
            />
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-gray-50 dark:bg-white/2 border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-16">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Why Choose Us?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Under the hood, SwiftStock stack designed for maximum responsiveness.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <Benefit
                  icon={<Zap className="text-amber-500" />}
                  title="Zero-Lag Architecture"
                  description="Powered by Next.js App Router and React Server Components, initial loads are instantaneous."
                />
                <Benefit
                  icon={<ShieldCheck className="text-emerald-500" />}
                  title="Type-Safe Reliability"
                  description="End-to-end type safety with TypeScript, Prisma ORM, and Zod input validation guarantees data integrity."
                />
              </div>
              <div className="space-y-8">
                <Benefit
                  icon={<BarChart3 className="text-blue-500" />}
                  title="Optimistic Updates"
                  description="Leveraging TanStack Query, stock adjustments feel instantaneous with optimistic UI rendering."
                />
                <Benefit
                  icon={<Box className="text-[#6c47ff]" />}
                  title="Seamless Imports"
                  description="Migrating is easy. Upload massive CSV files and let our robust background processing handle the rest safely."
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#6c47ff]" />
            <span className="font-bold tracking-tight">SwiftStock</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} SwiftStock. All rights reserved. Built
            for speed.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow group">
      <div className="w-12 h-12 rounded-xl bg-[#6c47ff]/10 text-[#6c47ff] dark:text-[#8b6fff] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Benefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 shrink-0">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-lg font-bold mb-2">{title}</h4>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
