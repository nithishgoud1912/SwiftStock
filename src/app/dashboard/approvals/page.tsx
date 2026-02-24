import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ApprovalsClient from "@/components/dashboard/approvals/ApprovalsClient";

export const metadata: Metadata = {
  title: "Approvals | SwiftStock",
  description: "Review and manage pending stock adjustment requests.",
};

export default async function ApprovalsPage() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Only Org Admins or Personal Workspace owners can view approvals
  const activeOrgId = orgId || userId;
  const isAuthorized = !orgId || orgRole === "org:admin";

  if (!isAuthorized) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
          <h2 className="text-lg font-bold mb-1">Access Denied</h2>
          <p>
            You do not have permission to view the Approvals dashboard. Please
            contact your Organization Admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Approvals Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review and approve stock adjustments requested by Members.
        </p>
      </header>

      <ApprovalsClient />
    </div>
  );
}
