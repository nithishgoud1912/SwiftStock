"use client";

import { useState } from "react";
import { updateOrganizationProfile } from "@/app/lib/actions/settings";
import toast from "react-hot-toast";
import { UploadDropzone } from "@/lib/uploadthing";
import { X } from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";

type OrganizationDetailsFormProps = {
  organization: {
    address: string | null;
    city: string | null;
    contact: string | null;
    logoUrl: string | null;
    currency: string;
  } | null;
};

export default function OrganizationDetailsForm({
  organization,
}: OrganizationDetailsFormProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    address: organization?.address || "",
    city: organization?.city || "",
    contact: organization?.contact || "",
    logoUrl: organization?.logoUrl || "",
    currency: organization?.currency || "INR",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOrganizationProfile({
        address: formData.address,
        city: formData.city,
        contact: formData.contact,
        logoUrl: formData.logoUrl,
        currency: formData.currency,
      });
      toast.success("Organization profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    } catch (error) {
      toast.error("Failed to update organization profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Organization Details
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Update the address and contact information for the invoices generated
          from the ledger.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Example St, Suite 400"
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-[#6c47ff] focus:ring-[#6c47ff] sm:text-sm border transition-colors shadow-sm"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="San Francisco, CA"
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-[#6c47ff] focus:ring-[#6c47ff] sm:text-sm border transition-colors shadow-sm"
            />
          </div>

          {/* Contact Email / Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Information
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="billing@example.com"
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-[#6c47ff] focus:ring-[#6c47ff] sm:text-sm border transition-colors shadow-sm"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-[#6c47ff] focus:ring-[#6c47ff] sm:text-sm border transition-colors shadow-sm"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {/* Logo Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization Logo
            </label>
            <div className="mt-1 flex items-center gap-4">
              {formData.logoUrl ? (
                <div className="relative h-20 w-20 shrink-0">
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain rounded-md border border-gray-200 dark:border-gray-700 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: "" })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <UploadDropzone
                    endpoint="organizationLogo"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setFormData({ ...formData, logoUrl: res[0].url });
                        toast.success("Logo uploaded successfully!");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                      container:
                        "border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg p-6",
                      label: "text-gray-500 dark:text-gray-400 font-medium",
                      button:
                        "bg-[#6c47ff] hover:bg-[#5a3ae0] after:bg-[#6c47ff] text-sm",
                      allowedContent:
                        "text-xs text-gray-400 dark:text-gray-500 mt-2",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700 mt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center items-center rounded-lg bg-[#6c47ff] hover:bg-[#5a3ae0] px-5 py-2.5 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Details"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
