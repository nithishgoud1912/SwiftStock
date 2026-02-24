"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecentActivity } from "@/app/lib/actions/inventory";
import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";

export default function RecentActivityFeed({
  initialData,
}: {
  initialData: any[];
}) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: () => getRecentActivity(),
    initialData,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
          <Clock size={20} className="text-gray-500" />
          Recent Activity
        </h2>
      </div>

      <div className="p-6">
        {isLoading && !activities ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="mt-1">
                  {activity.type === "IN" ? (
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                      <ArrowDownRight size={16} />
                    </div>
                  ) : (
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-600 dark:text-red-400">
                      <ArrowUpRight size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium dark:text-white">
                    {activity.type === "IN" ? "Stock Added" : "Stock Removed"}:{" "}
                    <span className="font-bold">{activity.product.name}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {activity.type === "IN" ? "+" : "-"}
                    {activity.quantity} units by{" "}
                    {activity.user.name || activity.user.email}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent activity found.
          </div>
        )}
      </div>
    </div>
  );
}
