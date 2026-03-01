import { getOrganization } from "@/app/lib/actions/settings";
import BillingClient from "@/components/dashboard/settings/billing/BillingClient";

export const metadata = {
  title: "Billing & Plans | SwiftStock",
  description: "Manage your organization's subscription and usage limits.",
};

export default async function BillingPage() {
  const organization = await getOrganization();

  // If for some reason the org isn't found, just pass null or redirect
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Billing & Plans
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your subscription tier, view your usage, and upgrade for more
          features.
        </p>
      </div>

      <BillingClient organization={organization} />
    </div>
  );
}
