"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { useTranslations } from "next-intl";
import { financialService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function LedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Ledger");
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["mahber-ledger", id],
    queryFn: () => financialService.getMahberLedger(id),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("pageDesc")}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : transactions?.data?.length === 0 ? (
        <div className="text-center py-12 glass rounded-card">
          <p className="text-text-secondary">{t("noTransactions")}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
              <TableHead className="text-right">{t("balanceAfter")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.data?.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">
                  {new Date(tx.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={tx.type === "CREDIT" ? "success" : "destructive"}
                  >
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${tx.type === "CREDIT" ? "text-status-success" : "text-status-error"}`}
                >
                  {tx.type === "CREDIT" ? "+" : "-"}
                  {tx.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-text-secondary">
                  {tx.balance_after.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
