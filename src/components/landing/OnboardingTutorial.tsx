"use client";

import { useState } from "react";
import {
  UserPlus,
  Building,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Mail,
  Coins,
  Package,
  PlusCircle,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Grid,
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  description: string;
  bullets: string[];
}

export default function OnboardingTutorial() {
  const [activeStep, setActiveStep] = useState(0);

  const steps: Step[] = [
    {
      id: 0,
      title: "Sign Up & Authenticate",
      icon: <UserPlus className="w-5 h-5" />,
      subtitle: "Secure single sign-on",
      description: "Create your free personal profile in seconds. We use Clerk to guarantee industrial-grade authentication and session security.",
      bullets: [
        "Sign up instantly using your Google account or any email address.",
        "Secure verification tokens protect your profile from unauthorized access.",
        "Automatic background synchronization registers you in the database via webhooks.",
      ],
    },
    {
      id: 1,
      title: "Set Up Your Organization",
      icon: <Building className="w-5 h-5" />,
      subtitle: "Isolated multi-tenant workspace",
      description: "Every account operates within an Organization. Set up a custom brand space to keep your stock data isolated and secure.",
      bullets: [
        "Create a new organization or join an existing team via email invitation.",
        "Configure settings like company name, address, contact email, and active currency.",
        "Upload your brand logo for automatic inclusion on PDF stock reports and invoices.",
      ],
    },
    {
      id: 2,
      title: "Add & Manage Your People",
      icon: <Users className="w-5 h-5" />,
      subtitle: "Role-Based Access Control",
      description: "Add team members, warehouse managers, or auditors to collaborate. Assign roles to secure permissions.",
      bullets: [
        "Send secure email invitations through the Organization Settings dashboard.",
        "Admins get full write access, configuration power, and billing controls.",
        "Members can view the dashboard and request stock adjustments without editing privileges.",
      ],
    },
    {
      id: 3,
      title: "Master Core Features",
      icon: <Package className="w-5 h-5" />,
      subtitle: "High-performance inventory tools",
      description: "Leverage SwiftStock's zero-lag tools designed to speed up daily warehouse and inventory operations.",
      bullets: [
        "Multi-Item Transactions: Add or remove quantities for multiple items at once.",
        "Low-Stock Indicator: High-visibility warnings fire when quantities dip below threshold.",
        "PDF/CSV Actions: Import massive inventories from CSV and export filtered views as PDFs.",
      ],
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 border-t border-gray-200 dark:border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6c47ff]/10 text-[#6c47ff] dark:text-[#8b6fff] text-xs font-semibold mb-4 border border-[#6c47ff]/20">
          Onboarding Guide
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
          New to SwiftStock?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Follow our interactive step-by-step walkthrough to set up your account, configure your workspace, invite your team, and manage your inventory with zero lag.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Steps Selector */}
        <div className="lg:col-span-5 space-y-4">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex gap-4 group cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 border-[#6c47ff] shadow-lg shadow-[#6c47ff]/5 dark:shadow-black/40 scale-[1.02]"
                    : "bg-gray-50/50 hover:bg-gray-100/50 dark:bg-white/2 dark:hover:bg-white/5 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#6c47ff] text-white"
                      : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 group-hover:bg-[#6c47ff]/10 group-hover:text-[#6c47ff]"
                  }`}
                >
                  {step.icon}
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Step {idx + 1} • {step.subtitle}
                  </span>
                  <h3 className="text-lg font-bold mt-1 text-gray-900 dark:text-white transition-colors group-hover:text-[#6c47ff] dark:group-hover:text-[#8b6fff]">
                    {step.title}
                  </h3>
                  {isActive && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed animate-fadeIn">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Visual Preview Mockup Window */}
        <div className="lg:col-span-7">
          <div className="relative bg-slate-100 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-black/70 overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* Background Accent Gradients */}
            <div className="absolute -top-12 -right-12 w-60 h-60 bg-[#6c47ff]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-[#8b6fff]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Mock Window Topbar Header */}
            <div className="relative flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500 ml-4 select-none">
                  https://swiftstock.app/setup-step-{activeStep + 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[10px] font-semibold text-gray-500 dark:text-gray-400 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Demo
              </div>
            </div>

            {/* Dynamic Panel Content depending on activeStep */}
            <div className="relative flex-grow flex items-center justify-center">
              {activeStep === 0 && (
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md animate-fadeIn">
                  <div className="text-center mb-6">
                    <h4 className="font-extrabold text-xl text-gray-900 dark:text-white flex items-center justify-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-[#6c47ff] text-white flex items-center justify-center text-sm font-black">S</span>
                      SwiftStock
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create your secure user workspace</p>
                  </div>

                  <button className="w-full py-2.5 px-4 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold text-sm transition-colors text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="relative my-4 flex py-1 items-center text-xs text-gray-400">
                    <div className="flex-grow border-t border-gray-200 dark:border-white/5" />
                    <span className="flex-shrink mx-4 font-mono select-none">or sign up with email</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-white/5" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email address</label>
                      <div className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black/35 border border-gray-200 dark:border-white/5 text-xs text-gray-400 select-none">
                        you@example.com
                      </div>
                    </div>
                    <button className="w-full py-2.5 bg-[#6c47ff] hover:bg-[#5a38e8] text-white rounded-lg font-semibold text-xs transition-colors shadow-md shadow-[#6c47ff]/20">
                      Continue
                    </button>
                  </div>

                  <div className="mt-4 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2 select-none">
                    <Database className="w-3.5 h-3.5" />
                    <span>Clerk webhook active: Supabase DB synched in 14ms</span>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#6c47ff]" />
                      Organization Details
                    </h4>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Multi-Tenant
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Org Name</label>
                        <div className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200 font-semibold">
                          Acme Distribution Inc
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company Email</label>
                        <div className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200 font-semibold">
                          info@acme.com
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Default Currency</label>
                        <div className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200 font-semibold">
                          INR (₹)
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Plan</label>
                        <div className="w-full px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          PRO Plan Active
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company Logo</label>
                      <div className="border border-dashed border-gray-200 dark:border-white/10 rounded-lg p-3 flex items-center justify-center gap-3 bg-gray-50/50 dark:bg-black/15">
                        <div className="w-8 h-8 rounded-md bg-[#6c47ff]/20 text-[#6c47ff] flex items-center justify-center font-bold text-xs">
                          ADI
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200">acme-logo-dark.png</p>
                          <p className="text-[9px] text-gray-400">124 KB • Upload Complete</p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-2 bg-[#6c47ff] hover:bg-[#5a38e8] text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save Details & Configure PDF
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-md animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#6c47ff]" />
                      Invite & Manage Team
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">RBAC Settings</span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invite Member via Email</label>
                    <div className="flex gap-2">
                      <div className="flex-grow px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 text-xs text-gray-400 select-none flex items-center">
                        warehouse-manager@acme.com
                      </div>
                      <div className="w-20 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200 font-semibold flex items-center justify-center">
                        Member
                      </div>
                      <button className="px-3 bg-[#6c47ff] text-white rounded-lg font-semibold text-xs flex items-center justify-center">
                        Invite
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Workspace Members</label>
                    
                    {/* Member Item 1 */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/15 border border-gray-100 dark:border-white/5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#6c47ff] text-white flex items-center justify-center font-bold text-[10px]">
                          AG
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">Alex Goud</p>
                          <p className="text-[9px] text-gray-400">alex@acme.com</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#6c47ff]/10 text-[#6c47ff] dark:text-[#8b6fff] border border-[#6c47ff]/20">
                        Admin (Owner)
                      </span>
                    </div>

                    {/* Member Item 2 */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/15 border border-gray-100 dark:border-white/5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-[10px]">
                          SJ
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">Sarah Jenkins</p>
                          <p className="text-[9px] text-gray-400">sarah@acme.com</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                        Member
                      </span>
                    </div>

                    {/* Member Item 3 */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-black/15 border border-gray-100 dark:border-white/5 text-xs opacity-60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                          JD
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">John Doe</p>
                          <p className="text-[9px] text-gray-400">john@acme.com</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Invited (Pending)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-md animate-fadeIn flex flex-col gap-4">
                  {/* Mock Inventory Toolbar */}
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-lg px-2.5 py-1 text-[11px] text-gray-400 flex-grow max-w-[180px]">
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span>Search items...</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300">
                        CSV Import
                      </span>
                      <span className="px-2 py-1 bg-[#6c47ff] text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <PlusCircle className="w-3 h-3" /> New Product
                      </span>
                    </div>
                  </div>

                  {/* Mock Inventory Table */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2">
                      <div className="col-span-5">Product Name</div>
                      <div className="col-span-3">SKU</div>
                      <div className="col-span-2 text-right">Stock</div>
                      <div className="col-span-2 text-right">Status</div>
                    </div>

                    {/* Row 1 - Low Stock */}
                    <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg bg-red-500/5 border border-red-500/20 shadow-sm relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                      <div className="col-span-5 font-bold text-gray-900 dark:text-white">Wireless Mechanical Keyboard</div>
                      <div className="col-span-3 font-mono text-[10px] text-gray-500">KB-MECH-01</div>
                      <div className="col-span-2 text-right font-extrabold text-red-600 dark:text-red-400">4 units</div>
                      <div className="col-span-2 text-right">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider animate-pulse">
                          Low Stock
                        </span>
                      </div>
                    </div>

                    {/* Row 2 - Good Stock */}
                    <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="col-span-5 font-bold text-gray-900 dark:text-white">USB-C Hub Multiport</div>
                      <div className="col-span-3 font-mono text-[10px] text-gray-500">HUB-USBC-03</div>
                      <div className="col-span-2 text-right font-extrabold text-gray-800 dark:text-gray-200">150 units</div>
                      <div className="col-span-2 text-right">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          In Stock
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Actions and PDF exports */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 text-[10px]">
                      <span className="block font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1">
                        <Bell className="w-3 h-3 text-red-500 animate-bounce" /> Low Stock Notification
                      </span>
                      <p className="text-[9px] text-gray-400 leading-tight">KB-MECH-01 dropped below low stock threshold (10 units). Alert triggered.</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 text-[10px] flex flex-col justify-between">
                      <span className="block font-bold text-gray-800 dark:text-gray-200">PDF Report Export</span>
                      <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1">
                        <span>Current filtered inventory</span>
                        <span className="text-indigo-500 font-bold hover:underline cursor-pointer flex items-center">
                          Download <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section: Step Text Details */}
            <div className="relative border-t border-gray-200 dark:border-white/10 pt-4 mt-6">
              <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Key Setup Actions:
              </h5>
              <ul className="grid sm:grid-cols-3 gap-2">
                {steps[activeStep].bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug flex items-start gap-1">
                    <span className="text-[#6c47ff] font-bold select-none">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
