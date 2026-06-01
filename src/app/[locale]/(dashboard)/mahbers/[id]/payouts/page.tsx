"use client";

import { useQuery } from "@tanstack/react-query";
import { use, useState } from "react";
import { HandCoins, Plus, Filter, Wallet, Banknote, Users } from "lucide-react";
import { financialService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { Payout, PayoutCategory } from "@/lib/types";

const categoryLabels: Record<PayoutCategory, string> = {
  Iddir_Benefit: "Iddir Benefit",
  Event_Reimbursement: "Event Reimbursement",
  Recurring: "Recurring",
  General: "General",
};

const categoryColors: Record<PayoutCategory, string> = {
  Iddir_Benefit: "text-purple-400 bg-purple-400/10",
  Event_Reimbursement: "text-blue-400 bg-blue-400/10",
  Recurring: "text-amber-400 bg-amber-400/10",
  General: "text-emerald-400 bg-emerald-400/10",
};

export default function PayoutsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: payoutsResponse, isLoading } = useQuery({
    queryKey: ["mahber-payouts", id],
    queryFn: () => financialService.getPayouts(id),
  });

  const { data: summary } = useQuery({
    queryKey: ["mahber-payouts-summary", id],
    queryFn: () => financialService.getPayoutSummary(id),
  });

  const payouts = payoutsResponse?.data ?? [];

  return (
    <div className="space-y-8 pb-20">
      <PageHeader title="Payouts" description="Manage disbursements to members">
        <Link href={`/mahbers/${id}/payouts/create`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Payout
          </Button>
        </Link>
      </PageHeader>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-gold/10 to-background-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Payouts</p>
                  <p className="text-2xl font-bold text-text-primary">
                    ETB {summary.total_amount.toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-gold opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gold/10 to-background-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Count</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {summary.total_count}
                  </p>
                </div>
                <Banknote className="w-8 h-8 text-gold opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gold/10 to-background-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Recipients</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {new Set(payouts.map((p) => p.member_id)).size}
                  </p>
                </div>
                <Users className="w-8 h-8 text-gold opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gold/10 to-background-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Categories</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {summary.category_breakdown.length}
                  </p>
                </div>
                <Filter className="w-8 h-8 text-gold opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && summary.category_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-primary">
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {summary.category_breakdown.map((cat) => (
                <div
                  key={cat.category}
                  className={`rounded-lg px-4 py-3 ${categoryColors[cat.category]}`}
                >
                  <p className="text-xs font-medium opacity-75">
                    {categoryLabels[cat.category]}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    ETB {cat.amount.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-60">{cat.count} payout(s)</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-text-primary">
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12">
              <HandCoins className="w-12 h-12 mx-auto text-text-secondary/40 mb-3" />
              <p className="text-text-secondary">No payouts yet</p>
              <Link href={`/mahbers/${id}/payouts/create`}>
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <Plus className="w-3 h-3" />
                  Create First Payout
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background-dark/30 hover:bg-background-dark/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <HandCoins className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {payout.member?.name ?? "Unknown Member"}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {payout.reason}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">
                      ETB {payout.amount.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${categoryColors[payout.category]}`}
                    >
                      {categoryLabels[payout.category]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
