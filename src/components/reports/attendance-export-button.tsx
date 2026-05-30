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

export function AttendanceExportButton({
  mahberId,
  startDate,
  endDate,
}: {
  mahberId: string;
  startDate?: string;
  endDate?: string;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await reportsService.exportAttendanceReport(mahberId, {
        startDate,
        endDate,
      });
      downloadBlob(blob, `attendance-report-${mahberId}.pdf`);
    } catch {
      toast.error("Failed to export attendance PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={exporting} onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      {exporting ? "Exporting…" : "Export PDF"}
    </Button>
  );
}
