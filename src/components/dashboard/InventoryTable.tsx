"use client";

import {
  AlertCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Download,
  QrCode,
  Filter,
  Loader2,
  Upload,
  Search,
  Package,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { importInventoryCSV } from "@/app/lib/actions/import";
import { useInventoryStore } from "@/app/lib/store/useInventoryStore";
import AdjustStockModal from "./AdjustStockModal";
import EditProductModal from "./EditProductModal";
import DeleteProductModal from "./DeleteProductModal";
import ManageBarcodesModal from "./ManageBarcodesModal";
import { useQuery } from "@tanstack/react-query";
import { getInventoryProducts } from "@/app/lib/actions/inventory";
import { useOrganization, useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { getCategories } from "@/app/lib/actions/settings";

// Inside the component:

import { Product } from "@/types/inventory";

export default function InventoryTable({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const {
    openAdjustModal,
    openEditProductModal,
    openDeleteProductModal,
    openManageBarcodesModal,
  } = useInventoryStore();

  const { membership } = useOrganization();
  const { orgId } = useAuth();
  const isAdmin = !orgId || membership?.role === "org:admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "IN_STOCK" | "LOW_STOCK"
  >("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );

  // Debounce search input to avoid excessive server calls
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clear selection if the delete modal successfully closes and clears the store
  useEffect(() => {
    const state = useInventoryStore.getState();
    if (
      !state.isDeleteProductModalOpen &&
      state.productsToDelete.length === 0
    ) {
      setSelectedProductIds(new Set());
    }
  }, [useInventoryStore((state) => state.isDeleteProductModalOpen)]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", debouncedSearch, statusFilter, categoryFilter],
    queryFn: () =>
      getInventoryProducts({
        take: 50,
        search: debouncedSearch || undefined,
        status: statusFilter,
        categoryId: categoryFilter,
      }),
  });

  // Fetch categories for the filter dropdown
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const displayProducts = data?.products || [];

  const handleExportCSV = () => {
    if (!displayProducts || displayProducts.length === 0) return;

    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Quantity",
      "Low Stock Threshold",
      "Cost Price",
      "Selling Price",
    ];
    const csvRows = displayProducts.map((p: any) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.category?.name || "Uncategorized"}"`,
      p.quantity,
      p.lowStockThreshold,
      p.costPrice,
      p.sellingPrice,
    ]);

    // Calculate Totals
    const totalQuantity = displayProducts.reduce(
      (sum: number, p: Product) => sum + p.quantity,
      0,
    );
    const totalCostPrice = displayProducts.reduce(
      (sum: number, p: Product) => sum + Number(p.costPrice) * p.quantity,
      0,
    );
    const totalSellingPrice = displayProducts.reduce(
      (sum: number, p: Product) => sum + Number(p.sellingPrice) * p.quantity,
      0,
    );
    const totalProfit = totalSellingPrice - totalCostPrice;

    // Append Totals Row
    csvRows.push([
      '"TOTALS"', // Product Name
      '""', // SKU
      '""', // Category
      totalQuantity,
      '""', // Low Stock Threshold
      totalCostPrice, // Total Cost
      totalSellingPrice, // Total Selling
      `"Profit: ${totalProfit}"`, // Adding extra info contextually
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((r: (string | number)[]) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `SwiftStock_Inventory_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importInventoryCSV(text);
      if (result.success) {
        toast.success(
          `Successfully imported/updated ${result.count} products from CSV.`,
        );
        refetch(); // Refresh data
      } else {
        toast.error(`Failed to import: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred reading the file.");
    } finally {
      setIsImporting(false);
      // Reset input completely
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] sm:text-sm transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-40">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-[#6c47ff] focus:border-[#6c47ff] sm:text-sm rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors appearance-none"
              >
                <option value="ALL">All Categories</option>
                {(categories || []).map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <Filter size={14} />
              </div>
            </div>

            <div className="relative flex-1 sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-[#6c47ff] focus:border-[#6c47ff] sm:text-sm rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <Filter size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isAdmin && selectedProductIds.size > 0 && (
            <button
              onClick={() =>
                openDeleteProductModal(Array.from(selectedProductIds))
              }
              className="flex items-center gap-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-transparent hover:bg-red-200 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm shrink-0"
            >
              <Trash2 size={16} />
              Delete ({selectedProductIds.size})
            </button>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImportCSV}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 bg-[#6c47ff]/10 text-[#6c47ff] dark:bg-[#6c47ff]/20 dark:text-[#8b6fff] border border-transparent hover:bg-[#6c47ff]/20 dark:hover:bg-[#6c47ff]/30 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isImporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isImporting ? "Importing..." : "Import CSV"}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!displayProducts || displayProducts.length === 0}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Download size={16} />
            Export to CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {isAdmin && (
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={
                      displayProducts.length > 0 &&
                      selectedProductIds.size === displayProducts.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductIds(
                          new Set(displayProducts.map((p: Product) => p.id)),
                        );
                      } else {
                        setSelectedProductIds(new Set());
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayProducts.map((item: any) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group ${selectedProductIds.has(item.id) ? "bg-[#6c47ff]/5 dark:bg-[#6c47ff]/10" : ""}`}
              >
                {isAdmin && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.has(item.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedProductIds);
                        if (e.target.checked) {
                          newSet.add(item.id);
                        } else {
                          newSet.delete(item.id);
                        }
                        setSelectedProductIds(newSet);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <div className="h-10 w-10 shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-[#6c47ff] dark:group-hover:text-[#8b6fff] transition-colors">
                      {item.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {item.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700">
                    {item.category?.name || "Uncategorized"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.quantity}
                  </div>
                  <div className="text-xs text-gray-400">
                    Min: {item.lowStockThreshold}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.quantity <= item.lowStockThreshold ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold">
                      <AlertCircle size={14} /> Low Stock
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2 items-center">
                    <button
                      onClick={() => openAdjustModal(item.id, "IN")}
                      className="inline-flex items-center gap-1 rounded bg-green-50 dark:bg-green-900/20 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                    >
                      <Plus size={16} /> Add
                    </button>
                    <button
                      onClick={() => openAdjustModal(item.id, "OUT")}
                      className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-900/20 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <Minus size={16} /> Remove
                    </button>
                    {isAdmin && (
                      <div className="inline-flex items-center ml-2 border-l border-gray-300 dark:border-gray-600 pl-2">
                        <button
                          onClick={() => openManageBarcodesModal(item)}
                          className="rounded-lg p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30 mr-1"
                          title="Manage Barcodes"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditProductModal(item)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 mr-1"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteProductModal(item)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render the models at the bottom of the component tree */}
      <AdjustStockModal />
      <EditProductModal />
      <DeleteProductModal />
      <ManageBarcodesModal />
    </>
  );
}
