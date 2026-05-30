import { delay } from "../utils";
import type { AttendanceTrends, FinancialReportSummary } from "@/lib/types";

export const reportsMock = {
  getFinancialReport: async (
    _mahberId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<FinancialReportSummary> => {
    await delay(400);
    return {
      totalContributions: 48500,
      totalFines: 1200,
      totalExpenses: 3200,
      totalPayouts: 15000,
      netBalance: 29500,
      startDate: params?.startDate,
      endDate: params?.endDate,
    };
  },

  exportReport: async (
    _mahberId: string,
    params: { format: "pdf" | "csv" },
  ): Promise<Blob> => {
    await delay(600);
    if (params.format === "csv") {
      const csv =
        "Category,Amount\nContributions,48500\nFines,1200\nExpenses,3200\nPayouts,15000\nNet,29500";
      return new Blob([csv], { type: "text/csv" });
    }
    return new Blob([new Uint8Array(100)], { type: "application/pdf" });
  },

  getAttendanceTrends: async (
    _mahberId: string,
    months = 6,
  ): Promise<AttendanceTrends> => {
    await delay(400);
    const now = new Date();
    const trends = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const month = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const rate = 72 + Math.round(Math.random() * 18);
      return {
        month,
        event_count: 2 + (i % 3),
        total_members: 24,
        total_attended: Math.round(24 * (rate / 100)),
        average_attendance_rate: rate,
      };
    });
    return { trends, total_active_members: 24 };
  },

  exportAttendanceReport: async (): Promise<Blob> => {
    await delay(600);
    return new Blob([new Uint8Array(100)], { type: "application/pdf" });
  },
};
