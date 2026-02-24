import type { Metadata } from "next";
import { OrganizationProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MembersClient from "@/components/dashboard/settings/MembersClient";

export const metadata: Metadata = {
  title: "Organization | SwiftStock Settings",
  description: "Manage your organization profile and team members.",
};

export default async function OrganizationSettingsPage() {
  const { orgId } = await auth();
  if (!orgId) redirect("/dashboard");

  return (
    <div className="w-auto h-auto flex flex-col items-center overflow-y-auto">
      <div className="min-h-[600px] flex items-stretch border-b border-gray-200 dark:border-gray-700 pb-8">
        <OrganizationProfile
          appearance={{
            baseTheme: undefined, // Let Clerk auto-detect or force light/dark depending on standard setup
            elements: {
              rootBox: "w-full flex-1",
              card: "w-full max-w-none shadow-none border-none rounded-none bg-transparent dark:bg-transparent",
              navbar: "border-r border-gray-200 dark:border-gray-700",
              navbarButton:
                "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
              headerTitle: "text-gray-900 dark:text-white",
              headerSubtitle: "text-gray-500 dark:text-gray-400",
              profileSectionTitleText: "text-gray-900 dark:text-white",
            },
          }}
        />
      </div>

      <div className="px-6 pb-12">
        <MembersClient />
      </div>
    </div>
  );
}
