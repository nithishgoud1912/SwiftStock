"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Tags, Webhook, CreditCard } from "lucide-react";
import { useOrganization, useAuth } from "@clerk/nextjs";

export default function SettingsSidebar() {
  const pathname = usePathname();
  const { membership } = useOrganization();
  const { orgId } = useAuth();
  const isAdmin = !orgId || membership?.role === "org:admin";

  const links = [
    {
      name: "Organization",
      href: "/dashboard/settings/organization",
      icon: Building2,
    },
    {
      name: "Categories",
      href: "/dashboard/settings/categories",
      icon: Tags,
    },
    {
      name: "Billing & Plans",
      href: "/dashboard/settings/billing",
      icon: CreditCard,
      adminOnly: true,
    },
    {
      name: "Developer Webhooks",
      href: "/dashboard/settings/webhooks",
      icon: Webhook,
      adminOnly: true,
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 mb-6 md:mb-0">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Settings
      </h2>
      <nav className="space-y-1">
        {links.map((link: any) => {
          if (link.adminOnly && !isAdmin) return null;

          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-[#6c47ff]/10 text-[#6c47ff] dark:bg-[#6c47ff]/20 dark:text-[#8b6fff]"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
