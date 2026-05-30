"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttendanceTrends } from "@/lib/types";

export function AttendanceTrendsChart({
  data,
  isLoading,
}: {
  data?: AttendanceTrends;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData =
    data?.trends.map((t) => ({
      label: t.month,
      value: Math.round(t.average_attendance_rate),
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance rate by month</CardTitle>
        {data?.total_active_members != null && (
          <p className="text-sm text-text-muted">
            {data.total_active_members} active members
          </p>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-text-muted">No attendance data for this period.</p>
        ) : (
          <BarChart data={chartData} height={200} />
        )}
      </CardContent>
    </Card>
  );
}
