"use client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getStockTransactions } from "@/app/lib/actions/inventory";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Download,
  Upload,
  Package,
  Search,
  Filter,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef } from "react";
import { useDebounce } from "use-debounce";
import { importTransactionsCSV } from "@/app/lib/actions/import";
import toast from "react-hot-toast";

export default function TransactionsClient() {
  const { ref, inView } = useInView();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IN" | "OUT">("ALL");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["transactions", debouncedSearch, typeFilter],
      queryFn: ({ pageParam }) =>
        getStockTransactions(
          pageParam as string | undefined,
          20,
          debouncedSearch,
          typeFilter,
        ),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten the infinite pages into a single array of transactions
  const transactions = data?.pages.flatMap((page) => page.transactions) || [];

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importTransactionsCSV(text);
      if (result.success) {
        toast.success(
          `Successfully imported ${result.count} transactions from CSV.`,
        );
        queryClient.resetQueries({ queryKey: ["transactions"] });
      } else {
        toast.error(`Failed to import: ${result.error}`);
      }
    } catch (err) {
      toast.error("An unexpected error occurred reading the file.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;

    const headers = [
      "Date & Time",
      "Product Name",
      "SKU",
      "Category",
      "Action",
      "Quantity Change",
      "User",
      "Notes",
    ];

    const csvRows = transactions.map((tx: any) => [
      `"${format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm:ss")}"`,
      `"${tx.product.name.replace(/"/g, '""')}"`,
      `"${tx.product.sku}"`,
      `"${tx.product.category?.name || "Uncategorized"}"`,
      tx.type === "IN" ? "Stock Added" : "Stock Removed",
      tx.type === "IN" ? tx.quantity : -tx.quantity,
      `"${tx.user.name || "Unknown"} (${tx.user.email})"`,
      `"${(tx.notes || "").replace(/"/g, '""')}"`,
    ]);

    // Calculate Totals for the Exported Ledger
    const totalAdded = transactions
      .filter((tx: any) => tx.type === "IN")
      .reduce((sum: number, tx: any) => sum + tx.quantity, 0);
    const totalRemoved = transactions
      .filter((tx: any) => tx.type === "OUT")
      .reduce((sum: number, tx: any) => sum + tx.quantity, 0);
    const netChange = totalAdded - totalRemoved;

    csvRows.push([
      '"TOTALS"', // Date
      '""', // Product
      '""', // SKU
      '""', // Category
      `"Added: ${totalAdded} | Removed: ${totalRemoved}"`, // Action summary
      netChange, // Net Quantity
      '""', // User
      '""', // Notes
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
      `SwiftStock_Transactions_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No transactions found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Stock adjustments will appear here automatically.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Filters */}
        <div className="flex items-center sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-[#6c47ff] focus:border-[#6c47ff] sm:text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors"
            />
          </div>

          <div className="relative flex-1 sm:w-40">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-[#6c47ff] focus:border-[#6c47ff] sm:text-sm rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors appearance-none"
            >
              <option value="ALL">All Types</option>
              <option value="IN">Restock (IN)</option>
              <option value="OUT">Dispatch (OUT)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <Filter size={14} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
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
            {isImporting ? "Importing..." : "Import Ledger"}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!transactions || transactions.length === 0}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Download size={16} />
            Export Ledger to CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-medium">Date & Time</th>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Quantity</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                  {format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {tx.product.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    SKU: {tx.product.sku}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700">
                    {(tx.product as any).category?.name || "Uncategorized"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      tx.type === "IN"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {tx.type === "IN" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {tx.type === "IN" ? "Stock Added" : "Stock Removed"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {tx.type === "IN" ? "+" : "-"}
                  {tx.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {tx.user.name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {tx.user.email}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {tx.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Intersection Observer Target for Infinite Scroll */}
        <div
          ref={ref}
          className="w-full flex justify-center p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#6c47ff]" />
              Loading more transactions...
            </div>
          ) : hasNextPage ? (
            <span className="text-sm text-gray-400">Scroll to load more</span>
          ) : transactions.length > 0 ? (
            <span className="text-sm text-gray-500 font-medium pb-2">
              You have reached the end of the ledger.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
