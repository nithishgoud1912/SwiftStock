"use client";

import { useState, useCallback } from "react";
import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import { addProductAction } from "@/app/lib/actions/inventory";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { getCategories, createCategory } from "@/app/lib/actions/settings";
import { X, Plus, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string; // local UUID for React keys
  name: string;
  sku: string;
  categoryId: string;
  description: string;
  quantity: number | "";
  lowStockThreshold: number | "";
  costPrice: number | "";
  sellingPrice: number | "";
  collapsed: boolean;
  error?: string;
}

const defaultRow = (): ProductRow => ({
  id: crypto.randomUUID(),
  name: "",
  sku: "",
  categoryId: "",
  description: "",
  quantity: 0,
  lowStockThreshold: 10,
  costPrice: 0,
  sellingPrice: 0,
  collapsed: false,
});

// ─── Helper: single compact field ────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-[#6c47ff] focus:outline-none focus:ring-1 focus:ring-[#6c47ff] transition-colors";

// ─── Component ───────────────────────────────────────────────────────────────

export default function AddProductModal() {
  const { isAddProductModalOpen, closeAddProductModal } = useInventoryStore();
  const [rows, setRows] = useState<ProductRow[]>([defaultRow()]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: isAddProductModalOpen,
  });

  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: () => createCategory({ name: newCategoryName }),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Apply the new category to all rows that have no category yet
      setRows((prev) =>
        prev.map((r) =>
          r.categoryId === "" ? { ...r, categoryId: newCat.id } : r,
        ),
      );
      setIsCreatingCategory(false);
      setNewCategoryName("");
      toast.success(`Category "${newCategoryName}" created!`);
    },
  });

  // ── Reset state on close
  const handleClose = useCallback(() => {
    setRows([defaultRow()]);
    setGlobalError("");
    setIsCreatingCategory(false);
    setNewCategoryName("");
    closeAddProductModal();
  }, [closeAddProductModal]);

  if (!isAddProductModalOpen) return null;

  // ── Row helpers
  const updateRow = (id: string, field: keyof ProductRow, value: any) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value, error: undefined } : r)),
    );

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { ...defaultRow(), categoryId: prev[prev.length - 1]?.categoryId ?? "" },
    ]);

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const toggleCollapse = (id: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, collapsed: !r.collapsed } : r)),
    );

  // ── Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setSubmitting(true);

    let hasError = false;

    // Basic client-side validation
    const validatedRows = rows.map((r) => {
      if (!r.name.trim()) {
        hasError = true;
        return { ...r, error: "Product name is required." };
      }
      if (!r.sku.trim()) {
        hasError = true;
        return { ...r, error: "SKU is required.", collapsed: false };
      }
      if (!r.categoryId) {
        hasError = true;
        return { ...r, error: "Please select a category.", collapsed: false };
      }
      return r;
    });

    if (hasError) {
      setRows(validatedRows);
      setSubmitting(false);
      return;
    }

    // Sequential submissions (keeps rate limit safe, avoids duplicate SKU race)
    let successCount = 0;
    const updatedRows: ProductRow[] = [...validatedRows];

    for (let i = 0; i < updatedRows.length; i++) {
      const r = updatedRows[i];
      try {
        const result = await addProductAction({
          name: r.name,
          sku: r.sku,
          categoryId: r.categoryId,
          description: r.description || undefined,
          quantity: Number(r.quantity) || 0,
          lowStockThreshold: Number(r.lowStockThreshold) || 10,
          costPrice: Number(r.costPrice) || 0,
          sellingPrice: Number(r.sellingPrice) || 0,
        });

        if (!result.success) {
          updatedRows[i] = {
            ...r,
            error: result.error || "Failed to create product.",
            collapsed: false,
          };
        } else {
          successCount++;
        }
      } catch {
        updatedRows[i] = {
          ...r,
          error: "Unexpected error.",
          collapsed: false,
        };
      }
    }

    setSubmitting(false);

    const failedRows = updatedRows.filter((r) => r.error);
    if (failedRows.length > 0) {
      setRows(updatedRows);
      toast.error(
        `${successCount} product${successCount !== 1 ? "s" : ""} added. ${failedRows.length} failed — check the highlighted rows.`,
      );
      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      }
    } else {
      toast.success(
        `${successCount} product${successCount !== 1 ? "s" : ""} added successfully!`,
      );
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      handleClose();
    }
  };

  const numRows = rows.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[92vh] flex flex-col overflow-hidden">
        {/* ── Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 dark:from-blue-900/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Products
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {numRows === 1
                  ? 'Single product — click "Add Another" to batch-add more'
                  : `Adding ${numRows} products at once`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Category creator (shared) */}
        {isCreatingCategory && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10 flex gap-2 items-center shrink-0">
            <input
              type="text"
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className={`${inputCls} flex-1`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => createCategoryMutation.mutate()}
              disabled={!newCategoryName || createCategoryMutation.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {createCategoryMutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingCategory(false);
                setNewCategoryName("");
              }}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Global error */}
        {globalError && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 shrink-0">
            <p className="text-sm text-red-700 dark:text-red-400">{globalError}</p>
          </div>
        )}

        {/* ── Scrollable product rows */}
        <form
          id="add-products-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
        >
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className={`rounded-xl border transition-all ${
                row.error
                  ? "border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              }`}
            >
              {/* Row header */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                onClick={() => toggleCollapse(row.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {row.name || (
                        <span className="text-gray-400 font-normal italic">
                          Untitled product
                        </span>
                      )}
                    </p>
                    {row.sku && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                        {row.sku}
                      </p>
                    )}
                  </div>
                  {row.error && (
                    <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full shrink-0">
                      {row.error}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRow(row.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove this product"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <span className="p-1.5 text-gray-400">
                    {row.collapsed ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                  </span>
                </div>
              </div>

              {/* Row fields */}
              {!row.collapsed && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  {/* Name + SKU */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Product Name *">
                      <input
                        type="text"
                        required
                        value={row.name}
                        onChange={(e) => updateRow(row.id, "name", e.target.value)}
                        placeholder="e.g. Wireless Mouse"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="SKU (Unique) *">
                      <input
                        type="text"
                        required
                        value={row.sku}
                        onChange={(e) => updateRow(row.id, "sku", e.target.value)}
                        placeholder="e.g. ELEC-WM-001"
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                  </div>

                  {/* Category */}
                  <Field label="Category *">
                    <div className="flex gap-2">
                      <select
                        required
                        value={row.categoryId}
                        onChange={(e) =>
                          updateRow(row.id, "categoryId", e.target.value)
                        }
                        className={`${inputCls} flex-1`}
                      >
                        <option value="" disabled>
                          Select a category
                        </option>
                        {categories?.map((cat: { id: string; name: string }) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {!isCreatingCategory && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategory(true)}
                          className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium text-[#6c47ff] dark:text-[#8b6fff] border border-[#6c47ff]/30 hover:bg-[#6c47ff]/5 dark:hover:bg-[#6c47ff]/10 transition-colors"
                        >
                          + New
                        </button>
                      )}
                    </div>
                  </Field>

                  {/* Description */}
                  <Field label="Description (Optional)">
                    <textarea
                      value={row.description}
                      onChange={(e) =>
                        updateRow(row.id, "description", e.target.value)
                      }
                      rows={2}
                      placeholder="Brief product description…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  {/* Qty + Threshold */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Initial Quantity">
                      <input
                        type="number"
                        min="0"
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "quantity",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Low Stock Threshold">
                      <input
                        type="number"
                        min="0"
                        value={row.lowStockThreshold}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "lowStockThreshold",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Cost Price">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.costPrice}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "costPrice",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Selling Price">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.sellingPrice}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "sellingPrice",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          ))}
        </form>

        {/* ── Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 space-y-3 shrink-0">
          {/* Add another row */}
          <button
            type="button"
            onClick={addRow}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all disabled:opacity-50"
          >
            <Plus size={16} />
            Add Another Product
          </button>

          {/* Counters */}
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
            <span>{numRows} product{numRows !== 1 ? "s" : ""} in queue</span>
            {rows.some((r) => r.error) && (
              <span className="text-red-500">
                · {rows.filter((r) => r.error).length} with errors
              </span>
            )}
          </div>

          {/* Submit / cancel */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-products-form"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Adding products…
                </>
              ) : (
                <>
                  <Package size={16} />
                  Add {numRows} Product{numRows !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
