"use client";

import { useState } from "react";
import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBarcodes,
  addBarcode,
  deleteBarcode,
} from "@/app/lib/actions/barcodes";
import { X, QrCode, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function ManageBarcodesModal() {
  const queryClient = useQueryClient();
  const {
    isManageBarcodesModalOpen,
    closeManageBarcodesModal,
    selectedProduct,
  } = useInventoryStore();

  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("UPC");

  const { data: barcodes, isLoading } = useQuery({
    queryKey: ["barcodes", selectedProduct?.id],
    queryFn: () => getBarcodes(selectedProduct!.id),
    enabled: !!selectedProduct && isManageBarcodesModalOpen,
  });

  const addMutation = useMutation({
    mutationFn: () => addBarcode(selectedProduct!.id, newCode, newType),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Barcode added!");
        setNewCode("");
        queryClient.invalidateQueries({
          queryKey: ["barcodes", selectedProduct?.id],
        });
      } else {
        toast.error(res.error || "Failed to add barcode");
      }
    },
    onError: () => toast.error("An error occurred"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBarcode(id),
    onSuccess: () => {
      toast.success("Barcode removed");
      queryClient.invalidateQueries({
        queryKey: ["barcodes", selectedProduct?.id],
      });
    },
    onError: () => toast.error("Failed to remove barcode"),
  });

  if (!isManageBarcodesModalOpen || !selectedProduct) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={closeManageBarcodesModal}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <QrCode className="text-blue-500" />
            Manage Barcodes
          </h2>
          <button
            onClick={closeManageBarcodesModal}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm mb-6">
          <p>
            Product: <strong>{selectedProduct.name}</strong> (SKU:{" "}
            {selectedProduct.sku})
          </p>
        </div>

        {/* Add New Barcode */}
        <div className="flex gap-2 mb-6">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="w-1/3 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="UPC">UPC</option>
            <option value="EAN">EAN</option>
            <option value="QR">QR Code</option>
          </select>
          <input
            type="text"
            placeholder="Enter code..."
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (!newCode.trim()) return;
              addMutation.mutate();
            }}
            disabled={addMutation.isPending || !newCode.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Existing Barcodes */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            </div>
          ) : barcodes?.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              No barcodes registered.
            </p>
          ) : (
            barcodes?.map((bc) => (
              <div
                key={bc.id}
                className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mr-2">
                    {bc.type}
                  </span>
                  <span className="text-sm font-mono dark:text-white">
                    {bc.code}
                  </span>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(bc.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
