"use client";

import { useQuery } from "@tanstack/react-query";
import { use, useState } from "react";
import { Wallet, Users, ArrowUpRight, Trophy, AlertCircle, Calendar } from "lucide-react";
import { financialService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function FinancialAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<"paid" | "unpaid">("paid");

  const { data: auditData, isLoading } = useQuery({
    queryKey: ["mahber-financial-audit", id],
    queryFn: () => financialService.getFinancialAudit(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Audit Log" description="Loading..." />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Audit Log" description="Failed to load audit data." />
      </div>
    );
  }

  const {
    expectedContributions,
    actualContributions,
    paidMembers,
    unpaidMembers,
    totalPayouts,
    payoutHistory,
    requiredPaymentsCount,
  } = auditData;

  const paidPercentage = expectedContributions > 0
    ? Math.min(100, Math.round((actualContributions / expectedContributions) * 100))
    : 0;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Financial Audit Log"
        description={`Audit report for the current cycle (Round ${requiredPaymentsCount}).`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-gold/30">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gold" />
              Contributions Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-6">
            <div
              className="w-48 h-48 rounded-full relative flex items-center justify-center shadow-lg"
              style={{
                background: `conic-gradient(var(--status-success) ${paidPercentage}%, var(--surface-active) ${paidPercentage}%)`,
              }}
            >
              <div className="w-36 h-36 bg-background rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-bold text-text-primary">{paidPercentage}%</span>
                <span className="text-xs text-text-muted">Collected</span>
              </div>
            </div>

            <div className="w-full space-y-4 pt-4 border-t border-border-glass">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Expected Total</span>
                <span className="font-bold text-text-primary">{expectedContributions.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-status-success">Actual Paid</span>
                <span className="font-bold text-status-success">{actualContributions.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-status-warning">Deficit</span>
                <span className="font-bold text-status-warning">
                  {Math.max(0, expectedContributions - actualContributions).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              Member Status
            </CardTitle>
            <div className="flex bg-surface-active rounded-md p-1">
              <Button
                variant={activeTab === "paid" ? "default" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setActiveTab("paid")}
              >
                Paid ({paidMembers.length})
              </Button>
              <Button
                variant={activeTab === "unpaid" ? "default" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setActiveTab("unpaid")}
              >
                Unpaid ({unpaidMembers.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "paid" && (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {paidMembers.length === 0 ? (
                  <p className="text-center text-text-muted py-8">No members have paid the required amount.</p>
                ) : (
                  paidMembers.map((member: any) => (
                    <div key={member.id} className="flex justify-between items-center p-3 rounded-md bg-surface-active/30 border border-border-glass">
                      <div>
                        <p className="font-medium text-text-primary">{member.name}</p>
                        <p className="text-xs text-text-secondary">{member.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-status-success">{member.amount.toLocaleString()} ETB</p>
                        <p className="text-xs text-text-muted">{member.paymentCount} payments</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "unpaid" && (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {unpaidMembers.length === 0 ? (
                  <p className="text-center text-text-muted py-8">All members are up to date!</p>
                ) : (
                  unpaidMembers.map((member: any) => (
                    <div key={member.id} className="flex justify-between items-center p-3 rounded-md bg-status-warning/10 border border-status-warning/20">
                      <div>
                        <p className="font-medium text-text-primary">{member.name}</p>
                        <p className="text-xs text-text-secondary">{member.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-status-warning">{member.amount.toLocaleString()} / {member.expectedAmount.toLocaleString()} ETB</p>
                        <p className="text-xs text-text-muted">{member.paymentCount} / {requiredPaymentsCount} payments</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Payout & Winner History
            </div>
            <span className="text-sm font-normal text-text-secondary bg-surface-active px-3 py-1 rounded-full">
              Total Paid Out: <strong className="text-text-primary">{totalPayouts.toLocaleString()} ETB</strong>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payoutHistory.length === 0 ? (
            <div className="text-center py-12 glass rounded-card">
              <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary text-lg">No payouts have been made yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutHistory.map((payout: any) => (
                <div key={payout.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-md bg-surface-active/30 border border-border-glass gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary flex items-center gap-2">
                        {payout.winner}
                        <Badge variant="outline" className="text-[10px] uppercase">{payout.type.replace("_", " ")}</Badge>
                      </p>
                      <p className="text-xs text-text-secondary mt-1 max-w-md">{payout.description}</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-right w-full sm:w-auto flex justify-between sm:block border-t sm:border-t-0 border-border-glass pt-2 sm:pt-0">
                    <p className="font-bold text-text-primary">{payout.amount.toLocaleString()} ETB</p>
                    <p className="text-xs text-text-muted flex items-center gap-1 justify-end mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(payout.date).toLocaleDateString()}
                    </p>
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
