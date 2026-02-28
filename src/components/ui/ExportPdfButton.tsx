"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { exportToPdf, ExportPdfConfig } from "@/lib/utils/export";
import toast from "react-hot-toast"; // Based on your #17 task update

interface ExportPdfButtonProps extends Omit<
  ExportPdfConfig,
  "title" | "columns" | "data"
> {
  title: string;
  // We accept a function so we don't block the render cycle evaluating massive arrays
  getData: () => { columns: string[]; data: (string | number)[][] };
}

export function ExportPdfButton({
  title,
  getData,
  orgName,
  orgLogo,
  orgAddress,
  filename,
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const { columns, data } = getData();

      if (!data || data.length === 0) {
        toast.error("No data available to export");
        return;
      }

      // Allow UI to breathe before blocking thread processing PDF
      setTimeout(async () => {
        try {
          await exportToPdf({
            title,
            columns,
            data,
            orgName,
            orgLogo,
            orgAddress,
            filename,
          });
          toast.success("PDF Report generated successfully");
        } catch (e) {
          console.error(e);
          toast.error("Failed to generate PDF");
        } finally {
          setIsExporting(false);
        }
      }, 100);
    } catch (error) {
      console.error("PDF Export Failure:", error);
      toast.error("Failed to generate PDF");
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
    >
      <Download className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} />
      {isExporting ? "Generating..." : "Export PDF"}
    </button>
  );
}
