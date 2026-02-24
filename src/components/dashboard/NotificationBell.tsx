"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertTriangle, PackageX } from "lucide-react";
import { getLowStockAlerts } from "@/app/lib/actions/inventory";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  // Poll for low stock alerts or rely on generic cache invalidations
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getLowStockAlerts(),
    refetchInterval: 30000, // Background poll every 30 seconds just in case
  });

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-full transition-colors"
      >
        <Bell size={20} />
        {alerts.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-black"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Invisible overlay to click outside and close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Active Alerts
              </h3>
              <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 py-0.5 px-2 rounded-full text-xs font-medium">
                {alerts.length} New
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Checking stock levels...
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-green-500 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    All Clear!
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your inventory levels look healthy.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {alerts.map((alert: any) => (
                    <li
                      key={alert.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 self-start p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {alert.product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            SKU: {alert.product.sku}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {alert.product.quantity} in stock
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              (Threshold: {alert.product.lowStockThreshold})
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
