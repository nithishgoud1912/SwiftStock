"use client";

import { AlertCircle, Plus, Minus } from "lucide-react";
import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import AdjustStockModal from "./AdjustStockModal";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/app/lib/actions/inventory";

// Inside the component:

export default function InventoryTable({
  initialProducts,
  activeOrgId,
}: {
  initialProducts: any[];
  activeOrgId: string;
}) {
  const openAdjustModal = useInventoryStore((state) => state.openAdjustModal);
  const { data } = useQuery({
    queryKey: ["inventory", activeOrgId],
    queryFn: () => getDashboardData(activeOrgId),
    initialData: { products: initialProducts, lowStockCount: 0, totalItems: 0 },
  });

  const displayProducts = data?.products;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayProducts.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium dark:text-white">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {item.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold dark:text-white">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.quantity <= item.lowStockThreshold ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold">
                      <AlertCircle size={14} /> Low Stock
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openAdjustModal(item.id, "IN")}
                      className="inline-flex items-center gap-1 rounded bg-green-50 dark:bg-green-900/20 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                    >
                      <Plus size={16} /> Add
                    </button>
                    <button
                      onClick={() => openAdjustModal(item.id, "OUT")}
                      className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-900/20 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <Minus size={16} /> Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render the modal at the bottom of the component tree */}
      <AdjustStockModal activeOrgId={activeOrgId} />
    </>
  );
}
