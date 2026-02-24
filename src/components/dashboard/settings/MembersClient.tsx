"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationMembers,
  syncOrganizationMembers,
} from "@/app/lib/actions/settings";
import { Users, RefreshCw, ShieldAlert, User as UserIcon } from "lucide-react";
import Image from "next/image";

export default function MembersClient() {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["orgMembers"],
    queryFn: () => getOrganizationMembers(),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncOrganizationMembers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgMembers"] });
    },
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full mt-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={24} className="text-blue-600 dark:text-blue-400" />
            Database Synchronization
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            This table reflects your local Prisma database
            (`OrganizationMember`). Sync with Clerk to pull down new users if
            webhooks were missed.
          </p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={syncMutation.isPending ? "animate-spin" : ""}
          />
          {syncMutation.isPending ? "Syncing..." : "Force Sync Clerk Database"}
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Database Role</th>
              <th className="px-6 py-4 text-right">Data Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading database records...
                </td>
              </tr>
            ) : members && members.length > 0 ? (
              members.map((member: any) => (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                    {member.user?.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <UserIcon size={14} className="text-gray-400" />
                      </div>
                    )}
                    {member.user?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {member.user?.email || "No email"}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {member.role === "org:admin" ? (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-md font-semibold text-xs">
                        <ShieldAlert size={12} />
                        DB Admin
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded-md font-medium text-xs">
                        Member
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-green-600 dark:text-green-500 font-medium">
                    Prisma DB
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <p className="mb-2 text-lg">
                    ⚠️ No OrganizationMembers found in local Database.
                  </p>
                  <p className="text-sm">
                    Click "Force Sync" to pull down records from Clerk via API.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
