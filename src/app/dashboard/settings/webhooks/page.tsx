import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWebhooks } from "@/app/lib/actions/webhooks";
import WebhooksClient from "@/components/dashboard/settings/webhooks/WebhooksClient";
import { Webhook } from "lucide-react";

export const metadata: Metadata = {
  title: "Webhooks | SwiftStock Settings",
  description:
    "Configure webhook endpoints for real-time inventory event notifications.",
};

export default async function WebhooksSettingsPage() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) redirect("/sign-in");
  if (orgId && orgRole !== "org:admin") redirect("/dashboard");

  const webhooks = await getWebhooks();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Webhook className="w-6 h-6 text-blue-600" />
          Developer Webhooks
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
          Automate your business by integrating SwiftStock with your external
          systems. When inventory events occur, we'll send a real-time HTTP POST
          payload to your configured URLs.
        </p>
      </div>

      <WebhooksClient initialWebhooks={webhooks} />
    </div>
  );
}
