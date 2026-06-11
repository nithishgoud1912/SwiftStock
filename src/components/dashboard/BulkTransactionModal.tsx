"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import { bulkAdjustStock } from "@/app/lib/actions/inventory";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { getInventoryProducts } from "@/app/lib/actions/inventory";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  PackagePlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface LineItem {
  productId: string;
  productName: string;
  sku: string;
  currentQty: number;
  quantityChange: number;
  type: "IN" | "OUT";
  notes: string;
}

function makeLineItem(p: {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}): LineItem {
  return {
    productId: p.id,
    productName: p.name,
    sku: p.sku,
    currentQty: p.quantity,
    quantityChange: 1,
    type: "IN",
    notes: "",
  };
}

export default function BulkTransactionModal() {
  const {
    isBulkTransactionModalOpen,
    closeBulkTransactionModal,
    bulkSeedProducts,
  } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch all products for the picker
  const { data } = useQuery({
    queryKey: ["inventory", "", "ALL", "ALL"],
    queryFn: () => getInventoryProducts({ take: 100 }),
    enabled: isBulkTransactionModalOpen,
  });

  const allProducts = data?.products || [];

  // Filter products: exclude already-added ones and match search
  const filteredProducts = useMemo(() => {
    const addedIds = new Set(lineItems.map((i) => i.productId));
    return allProducts.filter(
      (p: any) =>
        !addedIds.has(p.id) &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [allProducts, lineItems, searchQuery]);

  // Focus search when picker opens
  useEffect(() => {
    if (showProductPicker) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showProductPicker]);

  // Seed line items from inventory selection when modal opens
  useEffect(() => {
    if (isBulkTransactionModalOpen) {
      if (bulkSeedProducts.length > 0) {
        setLineItems(bulkSeedProducts.map(makeLineItem));
        setShowProductPicker(false);
      } else {
        setLineItems([]);
        setShowProductPicker(false);
      }
      setSearchQuery("");
    } else {
      // Reset on close
      setLineItems([]);
      setSearchQuery("");
      setShowProductPicker(false);
    }
  }, [isBulkTransactionModalOpen, bulkSeedProducts]);

  const addProduct = (product: any) => {
    setLineItems((prev) => [...prev, makeLineItem(product)]);
    setSearchQuery("");
    setShowProductPicker(false);
  };

  const updateItem = (productId: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeItem = (productId: string) => {
    setLineItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const mutation = useMutation({
    mutationFn: () =>
      bulkAdjustStock(
        lineItems.map((item) => ({
          productId: item.productId,
          quantityChange: item.quantityChange,
          type: item.type,
          notes: item.notes || undefined,
        })),
      ),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["inventory"] });
      const previousInventory = queryClient.getQueryData([
        "inventory",
        "",
        "ALL",
        "ALL",
      ]);

      queryClient.setQueryData(
        ["inventory", "", "ALL", "ALL"],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            products: old.products.map((p: any) => {
              const lineItem = lineItems.find((i) => i.productId === p.id);
              if (!lineItem) return p;
              return {
                ...p,
                quantity:
                  p.quantity +
                  (lineItem.type === "IN"
                    ? lineItem.quantityChange
                    : -lineItem.quantityChange),
              };
            }),
          };
        },
      );

      return { previousInventory };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(
          ["inventory", "", "ALL", "ALL"],
          context.previousInventory,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) return;

    const invalid = lineItems.find((i) => i.quantityChange <= 0);
    if (invalid) {
      toast.error(`Quantity for "${invalid.productName}" must be at least 1.`);
      return;
    }

    mutation.mutate(undefined, {
      onSuccess: (data: any) => {
        if (data?.status === "PENDING") {
          toast.success(
            `${lineItems.length} adjustments sent to an Admin for approval.`,
          );
        } else {
          toast.success(
            `Successfully adjusted ${lineItems.length} product${lineItems.length > 1 ? "s" : ""}!`,
          );
        }
        closeBulkTransactionModal();
      },
      onError: (err: any) => {
        toast.error(err.message || "Transaction failed. Please try again.");
      },
    });
  };

  if (!isBulkTransactionModalOpen) return null;

  const totalIn = lineItems
    .filter((i) => i.type === "IN")
    .reduce((s, i) => s + i.quantityChange, 0);
  const totalOut = lineItems
    .filter((i) => i.type === "OUT")
    .reduce((s, i) => s + i.quantityChange, 0);

  const hasInsufficientStock = lineItems.some(
    (i) => i.type === "OUT" && i.quantityChange > i.currentQty,
  );

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBulkTransactionModal();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#6c47ff]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6c47ff]/10 dark:bg-[#6c47ff]/20">
              <ShoppingCart className="h-5 w-5 text-[#6c47ff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Bulk Stock Transaction
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {bulkSeedProducts.length > 0
                  ? `${lineItems.length} item${lineItems.length !== 1 ? "s" : ""} pre-loaded from selection`
                  : "Add or remove stock across multiple products at once"}
              </p>
            </div>
          </div>
          <button
            onClick={closeBulkTransactionModal}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {/* Empty state */}
            {lineItems.length === 0 && !showProductPicker && (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <PackagePlus className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No items added yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Click "Add Product" below to get started
                </p>
              </div>
            )}

            {/* Line items */}
            {lineItems.map((item) => (
              <div
                key={item.productId}
                className={`rounded-xl border p-4 transition-all ${
                  item.type === "IN"
                    ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10"
                    : "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10"
                }`}
              >
                {/* Product info + remove */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {item.sku} ·{" "}
                      <span className="font-semibold">{item.currentQty}</span>{" "}
                      in stock
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* Type toggle */}
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Direction
                    </label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                      <button
                        type="button"
                        onClick={() => updateItem(item.productId, "type", "IN")}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold transition-colors ${
                          item.type === "IN"
                            ? "bg-green-500 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }`}
                      >
                        <ArrowUpRight size={13} /> IN
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(item.productId, "type", "OUT")
                        }
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold transition-colors ${
                          item.type === "OUT"
                            ? "bg-red-500 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        }`}
                      >
                        <ArrowDownRight size={13} /> OUT
                      </button>
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Quantity
                    </label>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(
                            item.productId,
                            "quantityChange",
                            Math.max(1, item.quantityChange - 1),
                          )
                        }
                        className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantityChange}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "quantityChange",
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white bg-transparent focus:outline-none w-12 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(
                            item.productId,
                            "quantityChange",
                            item.quantityChange + 1,
                          )
                        }
                        className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) =>
                        updateItem(item.productId, "notes", e.target.value)
                      }
                      placeholder="e.g. Damaged goods"
                      maxLength={100}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6c47ff] focus:border-[#6c47ff]"
                    />
                  </div>
                </div>

                {/* OUT insufficient stock warning */}
                {item.type === "OUT" &&
                  item.quantityChange > item.currentQty && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-2.5 py-1.5">
                      <AlertCircle size={13} />
                      <span>
                        Only {item.currentQty} available — will fail on submit.
                      </span>
                    </div>
                  )}
              </div>
            ))}

            {/* Product Picker */}
            {showProductPicker && (
              <div className="rounded-xl border border-[#6c47ff]/30 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by product name or SKU..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6c47ff]"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      {searchQuery
                        ? "No products match your search."
                        : "All products have been added."}
                    </p>
                  ) : (
                    filteredProducts.map((product: any) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#6c47ff]/5 dark:hover:bg-[#6c47ff]/10 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#6c47ff] dark:group-hover:text-[#8b6fff] transition-colors">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {product.sku} ·{" "}
                            <span
                              className={
                                product.quantity <= product.lowStockThreshold
                                  ? "text-red-500"
                                  : "text-green-600 dark:text-green-400"
                              }
                            >
                              {product.quantity} in stock
                            </span>
                          </p>
                        </div>
                        <Plus
                          size={16}
                          className="text-[#6c47ff] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        />
                      </button>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(false)}
                    className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-1 transition-colors"
                  >
                    Close picker
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 space-y-3">
            {/* Add product button */}
            {!showProductPicker && (
              <button
                type="button"
                onClick={() => setShowProductPicker(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#6c47ff]/40 text-[#6c47ff] dark:text-[#8b6fff] text-sm font-medium hover:bg-[#6c47ff]/5 dark:hover:bg-[#6c47ff]/10 hover:border-[#6c47ff]/70 transition-all"
              >
                <Plus size={16} />
                Add Product
              </button>
            )}

            {/* Summary row */}
            {lineItems.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {lineItems.length} item{lineItems.length > 1 ? "s" : ""}
                </span>
                <div className="flex-1" />
                {totalIn > 0 && (
                  <span className="flex items-center gap-1 text-green-700 dark:text-green-400 font-semibold text-xs bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                    <ArrowUpRight size={13} />+{totalIn} IN
                  </span>
                )}
                {totalOut > 0 && (
                  <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold text-xs bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                    <ArrowDownRight size={13} />-{totalOut} OUT
                  </span>
                )}
              </div>
            )}

            {/* Insufficient stock global warning */}
            {hasInsufficientStock && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                Some OUT quantities exceed available stock. Fix them before submitting.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeBulkTransactionModal}
                disabled={mutation.isPending}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || lineItems.length === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#6c47ff] hover:bg-[#5835e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#6c47ff]/30"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Submit Transaction
                    {lineItems.length > 0 && (
                      <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-xs">
                        {lineItems.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
