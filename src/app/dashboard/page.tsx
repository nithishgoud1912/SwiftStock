import { getDashboardData } from "@/app/lib/actions/inventory";
import InventoryTable from "@/components/dashboard/InventoryTable";
import AddProductButton from "@/components/dashboard/AddProductButton";
import AddProductModal from "@/components/dashboard/AddProductModal";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Use orgId if they are in an organization, otherwise their personal userId acts as the tenant
  const activeOrgId = orgId || userId;

  // Fetch data directly from the database because this is a Server Component!
  const dashboardData = await getDashboardData(activeOrgId);

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventory Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your stock and track low items.
          </p>
        </div>

        {/* We will build the Add Product modal later! */}
        <AddProductButton />
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Total Products Unique
          </p>
          <p className="text-3xl font-bold mt-2 dark:text-white">
            {dashboardData.products.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Total Items in Stock
          </p>
          <p className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">
            {dashboardData.totalItems}
          </p>
        </div>

        <div
          className={`p-6 rounded-xl border shadow-sm flex flex-col justify-center ${
            dashboardData.lowStockCount > 0
              ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          }`}
        >
          <p
            className={`${dashboardData.lowStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"} text-sm font-medium`}
          >
            Low Stock Alerts
          </p>
          <p
            className={`text-3xl font-bold mt-2 ${dashboardData.lowStockCount > 0 ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
          >
            {dashboardData.lowStockCount}
          </p>
        </div>
      </div>

      {/* The Interactive Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Stock Levels
          </h2>
        </div>
        <div className="p-6">
          <InventoryTable activeOrgId={activeOrgId} initialProducts={dashboardData.products} />
        </div>
      </div>

      {/* Modals outside the flow */}
      <AddProductModal />
    </div>
  );
}
