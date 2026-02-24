"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  createWebhook,
  toggleWebhook,
  deleteWebhook,
} from "@/app/lib/actions/webhooks";
import { WebhookConfig } from "@prisma/client";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Webhook, Trash2, Power, PowerOff, Plus } from "lucide-react";

type FormData = {
  url: string;
  secret?: string;
};

export default function WebhooksClient({
  initialWebhooks,
}: {
  initialWebhooks: WebhookConfig[];
}) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(initialWebhooks);
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const res = await createWebhook(data);

    if (res.success && res.webhook) {
      toast.success("Webhook endpoint added successfully!");
      setWebhooks([res.webhook, ...webhooks]);
      setIsAdding(false);
      reset();
    } else {
      toast.error(res.error || "Failed to add webhook");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleWebhook(id, !currentStatus);
    if (res.success) {
      setWebhooks(
        webhooks.map((w) =>
          w.id === id ? { ...w, isActive: !currentStatus } : w,
        ),
      );
      toast.success(currentStatus ? "Webhook paused" : "Webhook activated");
    } else {
      toast.error("Failed to toggle webhook status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?"))
      return;

    const res = await deleteWebhook(id);
    if (res.success) {
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast.success("Webhook deleted");
    } else {
      toast.error("Failed to delete webhook");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Active Endpoints
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            SwiftStock will send HTTP POST requests to these URLs when your
            stock drops below the threshold.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus size={16} /> Add Endpoint
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Register New Endpoint
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payload URL
              </label>
              <input
                {...register("url", {
                  required: "URL is required",
                  pattern: {
                    value: /^https?:\/\//,
                    message: "Must be a valid HTTP/HTTPS URL",
                  },
                })}
                type="url"
                placeholder="https://your-server.com/api/webhooks"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              />
              {errors.url && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.url.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Secret Token (Optional)
              </label>
              <input
                {...register("secret")}
                type="password"
                placeholder="Used to verify the payload signature"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                If provided, SwiftStock will include a `x-swiftstock-signature`
                header using HMAC SHA-256 validation.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  reset();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Endpoint"}
              </button>
            </div>
          </form>
        </div>
      )}

      {webhooks.length === 0 && !isAdding ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <Webhook className="mx-auto h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            No webhooks configured
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Get started by creating a new endpoint.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {webhooks.map((hook) => (
              <li
                key={hook.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1 h-3 w-3 rounded-full shrink-0 ${hook.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white font-mono truncate max-w-sm sm:max-w-md">
                      {hook.url}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Added {format(new Date(hook.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono">
                        {hook.events.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(hook.id, hook.isActive)}
                    className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={hook.isActive ? "Pause webhook" : "Activate webhook"}
                  >
                    {hook.isActive ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(hook.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
