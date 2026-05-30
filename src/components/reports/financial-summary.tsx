import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialReportSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const items: Array<{
  key: keyof Pick<
    FinancialReportSummary,
    | "totalContributions"
    | "totalFines"
    | "totalExpenses"
    | "totalPayouts"
    | "netBalance"
  >;
  label: string;
}> = [
  { key: "totalContributions", label: "Total contributions" },
  { key: "totalFines", label: "Total fines" },
  { key: "totalExpenses", label: "Total expenses" },
  { key: "totalPayouts", label: "Total payouts" },
  { key: "netBalance", label: "Net balance" },
];

export function FinancialSummary({
  report,
  isLoading,
}: {
  report?: FinancialReportSummary;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.key}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text-primary">
              {(report?.[item.key] ?? 0).toLocaleString()} ETB
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
