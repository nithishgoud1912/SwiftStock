import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CategoriesClient from "@/components/dashboard/settings/CategoriesClient";

export const metadata: Metadata = {
  title: "Categories | SwiftStock Settings",
  description: "Manage your custom product categories.",
};

export default async function CategoriesSettingsPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 w-full h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Categories
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your custom taxonomy to organize inventory.
          </p>
        </div>
      </div>

      <CategoriesClient />
    </div>
  );
}
