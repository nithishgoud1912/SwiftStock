"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/app/lib/actions/inventory";
import {
  Package,
  Hash,
  AlertTriangle,
  DollarSign,
  IndianRupee,
} from "lucide-react";

import { Product } from "@/types/inventory";
import { formatCurrency } from "@/lib/utils";

export default function DashboardWidgets({
  initialData,
}: {
  initialData:
    | { products: Product[]; lowStockCount: number; totalItems: number }
    | undefined;
}) {
  const { data } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => getDashboardData(),
    initialData,
  });
  const products = data?.products || [];

  // Calculate specific metrics locally based on the fresh React Query data
  const totalUnique = products.length;
  const totalItems = products.reduce(
    (sum: number, p: Product) => sum + p.quantity,
    0,
  );
  const lowStockCount = products.filter(
    (p: Product) => p.quantity <= p.lowStockThreshold,
  ).length;

  // New Metric: Total Portfolio Value (Cost * Quantity)
  const totalValue = products.reduce(
    (sum: number, p: Product) => sum + Number(p.costPrice) * p.quantity,
    0,
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 1. Total Unique */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
              Total Products Unique
            </p>
            <p className="text-3xl font-bold dark:text-white">{totalUnique}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
            <Package size={20} />
          </div>
        </div>
      </div>
      {/* 2. Total Items */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
              Total Items in Stock
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalItems}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Hash size={20} />
          </div>
        </div>
      </div>
      {/* 3. Portfolio Value */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
              Total Portfolio Value
            </p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalValue, "INR")}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <span className="font-bold text-xl px-1">₹</span>
          </div>
        </div>
      </div>
      {/* 4. Low Stock Alerts */}
      <div
        className={`p-6 rounded-xl border shadow-sm flex flex-col justify-center ${lowStockCount > 0 ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p
              className={`${lowStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"} text-sm font-medium mb-1`}
            >
              Low Stock Alerts
            </p>
            <p
              className={`text-3xl font-bold ${lowStockCount > 0 ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
            >
              {lowStockCount}
            </p>
          </div>
          <div
            className={`p-3 rounded-lg ${lowStockCount > 0 ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" : "bg-gray-50 text-gray-400 dark:bg-gray-700"}`}
          >
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
