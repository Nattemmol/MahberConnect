"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { AdvisorReadOnlyBanner } from "@/components/reports/advisor-read-only-banner";
import { FinancialSummary } from "@/components/reports/financial-summary";
import { FinancialExportButtons } from "@/components/reports/financial-export-buttons";
import { useMahberMembership } from "@/lib/hooks/use-mahber-membership";
import { reportsService } from "@/lib/api/service-factory";

export default function FinancialReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isReadOnly } = useMahberMembership(id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: report, isLoading } = useQuery({
    queryKey: ["financial-report", id, startDate, endDate],
    queryFn: () =>
      reportsService.getFinancialReport(id, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/mahbers/${id}/reports`}
        className="inline-flex items-center text-sm text-text-secondary hover:text-gold"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to reports
      </Link>
      <PageHeader
        title="Financial report"
        description="Summary for the selected date range. Export for external review."
      />
      {isReadOnly && <AdvisorReadOnlyBanner />}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-text-muted">Start date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">End date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <FinancialExportButtons
          mahberId={id}
          startDate={startDate || undefined}
          endDate={endDate || undefined}
        />
      </div>
      <FinancialSummary report={report} isLoading={isLoading} />
    </div>
  );
}
