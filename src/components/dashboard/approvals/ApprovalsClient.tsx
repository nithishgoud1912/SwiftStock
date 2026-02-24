"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingAdjustments,
  approveAdjustment,
  rejectAdjustment,
} from "@/app/lib/actions/inventory";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ApprovalsClient() {
  const queryClient = useQueryClient();

  const { data: adjustments, isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: () => getPendingAdjustments(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAdjustment(id),
    onSuccess: () => {
      toast.success("Adjustment approved!");
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve adjustment");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectAdjustment(id),
    onSuccess: () => {
      toast.success("Adjustment rejected.");
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject adjustment");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!adjustments || adjustments.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No pending approvals
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          When Members request stock changes, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-6 py-4 font-medium">Requested</th>
            <th className="px-6 py-4 font-medium">Member</th>
            <th className="px-6 py-4 font-medium">Product</th>
            <th className="px-6 py-4 font-medium">Adjustment</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {adjustments.map((adj) => {
            const isAdd = adj.quantityChange > 0;
            return (
              <tr
                key={adj.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                  {format(new Date(adj.createdAt), "MMM d, yyyy • h:mm a")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {adj.requestedBy.name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {adj.requestedBy.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {adj.product.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    SKU: {adj.product.sku}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isAdd
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {isAdd ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {isAdd ? "+" : ""}
                    {adj.quantityChange}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    onClick={() => rejectMutation.mutate(adj.id)}
                    disabled={
                      rejectMutation.isPending || approveMutation.isPending
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(adj.id)}
                    disabled={
                      rejectMutation.isPending || approveMutation.isPending
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
