import type { Metadata } from "next";
import { getDashboardData } from "@/app/lib/actions/inventory";
import InventoryTable from "@/components/dashboard/InventoryTable";
import AddProductButton from "@/components/dashboard/AddProductButton";
import AddProductModal from "@/components/dashboard/AddProductModal";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Inventory | SwiftStock",
  description: "Browse, search, and manage your complete product catalog.",
};

export default async function InventoryPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Temp reuse of getDashboardData until we add pagination
  const data = await getDashboardData();

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Browse, search, and manage your complete product catalog.
          </p>
        </div>

        <AddProductButton />
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Products
          </h2>
        </div>
        <div className="p-6">
          <InventoryTable initialProducts={data.products} />
        </div>
      </div>

      <AddProductModal />
    </div>
  );
}
