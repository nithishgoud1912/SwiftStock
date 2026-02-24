"use client";

import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import {
  deleteProductAction,
  bulkDeleteProductsAction,
} from "@/app/lib/actions/inventory";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Product } from "@/types/inventory";

export default function DeleteProductModal() {
  const {
    isDeleteProductModalOpen,
    productsToDelete,
    closeDeleteProductModal,
  } = useInventoryStore();
  const queryClient = useQueryClient();

  const isBulk =
    productsToDelete.length > 1 || typeof productsToDelete[0] === "string";

  const mutation = useMutation({
    mutationFn: async () => {
      if (isBulk) {
        const ids = productsToDelete.map((p) =>
          typeof p === "string" ? p : (p as Product).id,
        );
        return bulkDeleteProductsAction(ids);
      } else {
        return deleteProductAction((productsToDelete[0] as Product).id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      closeDeleteProductModal();
    },
  });

  if (!isDeleteProductModalOpen || productsToDelete.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-transparent dark:border-gray-700">
        <h2 className="mb-2 text-xl font-bold text-red-600 dark:text-red-500">
          Delete {isBulk ? `${productsToDelete.length} Products` : "Product"}?
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Are you sure you want to delete{" "}
          <span className="font-bold text-gray-900 dark:text-white">
            {isBulk
              ? `these ${productsToDelete.length} items`
              : (productsToDelete[0] as Product).name}
          </span>
          ? This action will permanently delete all associated stock history and
          cannot be undone.
        </p>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={closeDeleteProductModal}
            className="rounded-lg px-4 py-2 font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {mutation.isPending
              ? "Deleting..."
              : isBulk
                ? `Yes, Delete ${productsToDelete.length}`
                : "Yes, Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
