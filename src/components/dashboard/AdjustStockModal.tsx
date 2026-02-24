"use client";

import { useState } from "react";
import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import { adjustStock } from "@/app/lib/actions/inventory";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function AdjustStockModal() {
  const {
    isAdjustModalOpen,
    selectedProductId,
    transactionType,
    closeAdjustModal,
  } = useInventoryStore();
  const [amount, setAmount] = useState<number | "">("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return adjustStock(selectedProductId!, Number(amount), transactionType);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["inventory"] });
      const previousInventory = queryClient.getQueryData(["inventory"]);

      // Optimistically update
      queryClient.setQueryData(["inventory"], (old: any) => {
        // Find the product and update its quantity instantly
        if (!old) return old;
        return {
          ...old,
          products: old.products.map((p: any) =>
            p.id === selectedProductId
              ? {
                  ...p,
                  quantity:
                    p.quantity +
                    (transactionType === "IN"
                      ? Number(amount)
                      : -Number(amount)),
                }
              : p,
          ),
        };
      });

      return { previousInventory };
    },
    onError: (err, variables, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(["inventory"], context.previousInventory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  // If the modal isn't supposed to be open, don't render anything!
  if (!isAdjustModalOpen || !selectedProductId) return null;

  const isAdding = transactionType === "IN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    mutation.mutate(undefined, {
      onSuccess: (data: any) => {
        if (data && data.status === "PENDING") {
          toast.success("Stock adjustment sent to an Admin for approval.");
        }
        closeAdjustModal();
        setAmount("");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-transparent dark:border-gray-700">
        <h2 className="mb-4 text-xl font-bold dark:text-white">
          {isAdding ? "Add Stock (IN)" : "Remove Stock (OUT)"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity to {isAdding ? "Add" : "Remove"}
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g., 50"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeAdjustModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                isAdding
                  ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
                  : "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
              }`}
            >
              {mutation.isPending ? "Saving..." : "Confirm Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
