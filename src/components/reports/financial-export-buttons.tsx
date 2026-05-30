"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportsService } from "@/lib/api/service-factory";
import toast from "react-hot-toast";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function FinancialExportButtons({
  mahberId,
  startDate,
  endDate,
}: {
  mahberId: string;
  startDate?: string;
  endDate?: string;
}) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    try {
      const blob = await reportsService.exportReport(mahberId, {
        format,
        startDate,
        endDate,
      });
      const ext = format === "csv" ? "csv" : "pdf";
      downloadBlob(blob, `financial-report-${mahberId}.${ext}`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={exporting !== null}
        onClick={() => handleExport("csv")}
      >
        <Download className="mr-2 h-4 w-4" />
        {exporting === "csv" ? "Exporting…" : "Export CSV"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={exporting !== null}
        onClick={() => handleExport("pdf")}
      >
        <Download className="mr-2 h-4 w-4" />
        {exporting === "pdf" ? "Exporting…" : "Export PDF"}
      </Button>
    </div>
  );
}
