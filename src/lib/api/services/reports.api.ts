import { apiClient } from "../client";
import type { AttendanceTrends, FinancialReportSummary } from "@/lib/types";

function normalizeFinancialReport(raw: Record<string, unknown>): FinancialReportSummary {
  return {
    totalContributions: Number(
      raw.totalContributions ?? raw.total_contributions ?? 0,
    ),
    totalFines: Number(raw.totalFines ?? raw.total_fines ?? 0),
    totalExpenses: Number(raw.totalExpenses ?? raw.total_expenses ?? 0),
    totalPayouts: Number(raw.totalPayouts ?? raw.total_payouts ?? 0),
    netBalance: Number(raw.netBalance ?? raw.net_balance ?? 0),
    startDate: (raw.startDate ?? raw.start_date) as string | undefined,
    endDate: (raw.endDate ?? raw.end_date) as string | undefined,
  };
}

export const reportsApi = {
  getFinancialReport: async (
    mahberId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<FinancialReportSummary> => {
    const response = await apiClient.get(
      `/mahbers/${mahberId}/reports/financial`,
      { params },
    );
    return normalizeFinancialReport(response.data as Record<string, unknown>);
  },

  exportReport: async (
    mahberId: string,
    params: {
      format: "pdf" | "csv";
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/mahbers/${mahberId}/reports/export`,
      { params, responseType: "blob" },
    );
    return response.data as Blob;
  },

  getAttendanceTrends: async (
    mahberId: string,
    months = 6,
  ): Promise<AttendanceTrends> => {
    const response = await apiClient.get<AttendanceTrends>(
      `/mahbers/${mahberId}/reports/attendance/trends`,
      { params: { months } },
    );
    return response.data;
  },

  exportAttendanceReport: async (
    mahberId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/mahbers/${mahberId}/reports/attendance/export`,
      { params, responseType: "blob" },
    );
    return response.data as Blob;
  },
};
