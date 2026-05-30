"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { AdvisorReadOnlyBanner } from "@/components/reports/advisor-read-only-banner";
import { AttendanceTrendsChart } from "@/components/reports/attendance-trends-chart";
import { AttendanceExportButton } from "@/components/reports/attendance-export-button";
import { useMahberMembership } from "@/lib/hooks/use-mahber-membership";
import { reportsService, eventService } from "@/lib/api/service-factory";

export default function AttendanceReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isReadOnly } = useMahberMembership(id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const months = 6;

  const { data: trends, isLoading } = useQuery({
    queryKey: ["attendance-trends", id, months],
    queryFn: () => reportsService.getAttendanceTrends(id, months),
  });

  const { data: eventsResponse } = useQuery({
    queryKey: ["mahber-events-list", id],
    queryFn: () => eventService.getEvents(id, 1, 20),
  });

  const events = eventsResponse?.data ?? [];

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
        title="Attendance report"
        description="Mahber-wide attendance trends. Open an event for per-event analytics."
      />
      {isReadOnly && <AdvisorReadOnlyBanner />}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-text-muted">Export from</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Export to</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <AttendanceExportButton
          mahberId={id}
          startDate={startDate || undefined}
          endDate={endDate || undefined}
        />
      </div>
      <AttendanceTrendsChart data={trends} isLoading={isLoading} />
      {events.length > 0 && (
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Recent events</h3>
            <p className="text-xs text-text-muted">Read-only links to event attendance</p>
          </div>
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/mahbers/${id}/events/${event.id}/attendance`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-background-subtle"
                >
                  <span className="font-medium text-text-primary">{event.title}</span>
                  <span className="text-text-muted">
                    {new Date(event.start_time).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
