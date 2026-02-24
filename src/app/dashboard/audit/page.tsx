import { Metadata } from "next";
import { getAuthorizedOrgId } from "@/lib/auth-helpers";
import AuditTrailClient from "@/components/dashboard/audit/AuditTrailClient";

export const metadata: Metadata = {
  title: "Audit Trail | SwiftStock",
  description: "View organizational audit logs and activity",
};

export default async function AuditTrailPage() {
  // Enforce auth and valid org context
  await getAuthorizedOrgId();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Audit Trail
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Track lifecycle events and modifications across your inventory data.
        </p>
      </div>

      <AuditTrailClient />
    </div>
  );
}
