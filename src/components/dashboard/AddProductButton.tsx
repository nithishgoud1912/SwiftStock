"use client";

import { useInventoryStore } from "@/app/lib/store/useInventoryStore";

export default function AddProductButton() {
  const openAddProductModal = useInventoryStore(
    (state) => state.openAddProductModal,
  );

  return (
    <button
      onClick={openAddProductModal}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
    >
      + Add New Product
    </button>
  );
}
