"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/app/lib/actions/audit";
import { format } from "date-fns";

type AuditLog = {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  createdAt: Date;
  user?: { email: string };
};

const renderChanges = (changes: any) => {
  if (!changes)
    return (
      <span className="text-gray-400 dark:text-gray-500 italic text-xs">
        None
      </span>
    );
  try {
    const parsed = typeof changes === "string" ? JSON.parse(changes) : changes;
    const keys = Object.keys(parsed);

    if (keys.length === 0)
      return (
        <span className="text-gray-400 dark:text-gray-500 italic text-xs">
          No specific changes recorded
        </span>
      );

    return (
      <div className="flex flex-wrap gap-2">
        {keys.map((key: any) => {
          let val = parsed[key];
          if (typeof val === "object") val = JSON.stringify(val);
          else val = String(val);

          return (
            <div
              key={key}
              className="flex items-center text-xs bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
            >
              <span className="font-medium text-gray-500 dark:text-gray-400 mr-1.5 uppercase text-[10px] tracking-wider">
                {key}:
              </span>
              <span
                className="text-gray-900 dark:text-gray-100 truncate max-w-[120px] font-mono font-medium"
                title={val}
              >
                {val}
              </span>
            </div>
          );
        })}
      </div>
    );
  } catch {
    return (
      <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
        Invalid JSON format
      </span>
    );
  }
};

export default function AuditTrailClient() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["auditLogs", { search, actionFilter, entityFilter }],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const result = await getAuditLogs({
        cursor: pageParam,
        take: 25,
        search,
        action: actionFilter,
        entityType: entityFilter,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
  });

  const logs = data?.pages?.flatMap((page) => page?.auditLogs || []) || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="w-full sm:w-[320px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search user or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#6c47ff] focus:outline-none focus:ring-1 focus:ring-[#6c47ff] transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#6c47ff] focus:outline-none focus:ring-1 focus:ring-[#6c47ff] transition-all"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#6c47ff] focus:outline-none focus:ring-1 focus:ring-[#6c47ff] transition-all"
          >
            <option value="ALL">All Entities</option>
            <option value="PRODUCT">PRODUCT</option>
            <option value="CATEGORY">CATEGORY</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Changes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    Loading audit trail...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-red-500"
                  >
                    Error loading data.
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 flex flex-col">
                      <span>{log.userName}</span>
                      <span className="text-xs text-gray-400">
                        {log.user?.email}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          log.action === "CREATE"
                            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400"
                            : log.action === "UPDATE"
                              ? "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400"
                              : log.action === "DELETE"
                                ? "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-gray-50 text-gray-700 ring-gray-600/20"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300 flex flex-col">
                      <span className="font-semibold">{log.entityType}</span>
                      <span className="text-xs font-mono">{log.entityId}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-sm">
                      {renderChanges(log.changes)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination / Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading more..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
