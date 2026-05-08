"use client";

import { useQuery } from "@tanstack/react-query";
import { use, useState } from "react";
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
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowDownRight, ArrowUpRight, Calendar, Info, Search } from "lucide-react";
import Link from "next/link";

interface LedgerEntry {
  id: string;
  mahber_id: string;
  member_id: string;
  transaction_type: string;
  amount: string;
  running_balance: string;
  payment_id: string | null;
  fine_id: string | null;
  lottery_id: string | null;
  description: string;
  created_at: string;
}

export default function WalletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Wallet");
  const [memberFilter, setMemberFilter] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  const { data: walletData, isLoading } = useQuery({
    queryKey: ["mahber-wallet", id, memberFilter],
    queryFn: () => financialService.getWallet(id, memberFilter ? { memberId: memberFilter } : undefined),
  });

  const balance = walletData?.balance || "0.00";
  const entries = walletData?.entries || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("pageDesc")}
      />

      {/* Balance Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-gold/25 via-gold/5 to-background border-gold/30 shadow-lg shadow-gold/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center shadow-inner">
              <Wallet className="w-7 h-7 md:w-8 md:h-8 text-gold animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wider text-text-secondary uppercase">
                {t("groupBalance")}
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gold tracking-tight mt-1">
                {parseFloat(balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-lg md:text-xl font-medium text-text-secondary">ETB</span>
              </h2>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button asChild className="w-full md:w-auto bg-gold hover:bg-gold-dark text-black font-semibold shadow-md shadow-gold/10">
              <Link href={`/mahbers/${id}/payments/initiate`}>
                {t("makeContribution")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-text-muted" />
          <Input
            placeholder={t("filterByMemberId")}
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        {memberFilter && (
          <Button variant="ghost" onClick={() => setMemberFilter("")} size="sm">
            {t("clearFilter")}
          </Button>
        )}
      </div>

      {/* Ledger Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 glass border-border-glass rounded-card">
          <Info className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary text-lg">{t("noEntries")}</p>
          <p className="text-text-muted text-sm mt-1">{t("noEntriesDesc")}</p>
        </div>
      ) : (
        <div className="glass rounded-card overflow-hidden border border-border-glass">
          <Table>
            <TableHeader className="bg-background-surface">
              <TableRow>
                <TableHead className="w-[140px]">{t("date")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead className="w-[120px]">{t("type")}</TableHead>
                <TableHead className="text-right w-[150px]">{t("amount")}</TableHead>
                <TableHead className="text-right w-[150px]">{t("balance")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const isPositive = parseFloat(entry.amount) >= 0;
                return (
                  <TableRow
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="cursor-pointer hover:bg-gold/5 transition-colors group"
                  >
                    <TableCell className="font-medium text-text-secondary text-sm">
                      {new Date(entry.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-text-primary font-medium group-hover:text-gold transition-colors">
                      {entry.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.transaction_type === "Contribution"
                            ? "success"
                            : entry.transaction_type === "Fine"
                            ? "destructive"
                            : "default"
                        }
                        className="capitalize"
                      >
                        {entry.transaction_type.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold text-base ${
                        isPositive ? "text-status-success" : "text-status-error"
                      }`}
                    >
                      <span className="flex items-center justify-end gap-1">
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4 text-status-success" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-status-error" />
                        )}
                        {isPositive ? "+" : ""}
                        {parseFloat(entry.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-text-secondary">
                      {parseFloat(entry.running_balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={t("transactionDetails")}
        description={t("detailsDesc")}
      >
        {selectedEntry && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 text-sm">
              <div>
                <span className="text-text-muted block text-xs">{t("dateTime")}</span>
                <span className="font-semibold text-text-primary flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-gold" />
                  {new Date(selectedEntry.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-xs">{t("transactionId")}</span>
                <span className="font-mono text-text-primary text-xs mt-1 block select-all bg-background-surface p-1 rounded border border-border">
                  {selectedEntry.id}
                </span>
              </div>
            </div>

            <div className="space-y-3 pb-2">
              <div>
                <span className="text-text-muted block text-xs">{t("description")}</span>
                <span className="font-medium text-text-primary mt-0.5 block leading-relaxed">
                  {selectedEntry.description}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-background-surface p-2.5 rounded-lg border border-border">
                  <span className="text-text-muted text-[10px] uppercase font-semibold">{t("type")}</span>
                  <span className="font-bold text-text-primary block mt-0.5 text-sm">
                    {selectedEntry.transaction_type}
                  </span>
                </div>
                <div className="bg-background-surface p-2.5 rounded-lg border border-border">
                  <span className="text-text-muted text-[10px] uppercase font-semibold">{t("amount")}</span>
                  <span className={`font-bold block mt-0.5 text-sm ${parseFloat(selectedEntry.amount) >= 0 ? "text-status-success" : "text-status-error"}`}>
                    {parseFloat(selectedEntry.amount) >= 0 ? "+" : ""}
                    {parseFloat(selectedEntry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-background-surface p-2.5 rounded-lg border border-border">
                  <span className="text-text-muted text-[10px] uppercase font-semibold">{t("balanceAfter")}</span>
                  <span className="font-bold text-text-primary block mt-0.5 text-sm">
                    {parseFloat(selectedEntry.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Links to associated entities */}
            {(selectedEntry.payment_id || selectedEntry.fine_id || selectedEntry.lottery_id) && (
              <div className="border-t border-border pt-4 space-y-2">
                <span className="text-text-muted block text-xs font-semibold">{t("associatedRecords")}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.payment_id && (
                    <Button asChild size="sm" variant="outline" className="border-gold/30 hover:bg-gold/10">
                      <Link href={`/mahbers/${id}/payments`}>
                        {t("viewPayments")}
                      </Link>
                    </Button>
                  )}
                  {selectedEntry.fine_id && (
                    <Button asChild size="sm" variant="outline" className="border-red-500/20 hover:bg-red-500/5 text-status-error">
                      <Link href={`/mahbers/${id}/fines`}>
                        {t("viewFine")}
                      </Link>
                    </Button>
                  )}
                  {selectedEntry.lottery_id && (
                    <Button asChild size="sm" variant="outline" className="border-gold/30 hover:bg-gold/10 text-gold">
                      <Link href={`/mahbers/${id}/lottery`}>
                        {t("viewLottery")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <Button variant="ghost" onClick={() => setSelectedEntry(null)}>
                {t("close")}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
