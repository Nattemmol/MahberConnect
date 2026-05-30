"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import { HandCoins, Plus, Filter, Wallet, Banknote, Users, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { financialService, memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { Payout, PayoutCategory, PayoutStatus } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import toast from "react-hot-toast";

const statusColors: Record<PayoutStatus, string> = {
  PENDING_APPROVAL: "text-amber-500 bg-amber-500/10",
  APPROVED: "text-blue-500 bg-blue-500/10",
  PAID: "text-green-500 bg-green-500/10",
  REJECTED: "text-red-500 bg-red-500/10",
};

const categoryColors: Record<PayoutCategory, string> = {
  Iddir_Benefit: "text-purple-400 bg-purple-400/10",
  Event_Reimbursement: "text-blue-400 bg-blue-400/10",
  Recurring: "text-amber-400 bg-amber-400/10",
  General: "text-emerald-400 bg-emerald-400/10",
  Equb_Payout: "text-gold bg-gold/10",
};

export default function PayoutsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Payouts");
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const categoryLabels: Record<PayoutCategory, string> = {
    Iddir_Benefit: t('iddirBenefit'),
    Event_Reimbursement: t('eventReimbursement'),
    Recurring: t('recurring'),
    General: t('general'),
    Equb_Payout: t('equbPayout'),
  };

  const { data: payoutsResponse, isLoading } = useQuery({
    queryKey: ["mahber-payouts", id],
    queryFn: () => financialService.getPayouts(id),
  });

  const { data: summary } = useQuery({
    queryKey: ["mahber-payouts-summary", id],
    queryFn: () => financialService.getPayoutSummary(id),
  });

  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
  });

  const myMembership = membersResponse?.data?.find(m => m.user?.id === user?.id);
  const roleName = typeof myMembership?.role === 'string'
    ? myMembership.role
    : (myMembership?.role as any)?.name;

  const isAdmin = roleName === "ADMIN" || roleName === "Admin" || (myMembership?.role as any)?.permissions?.includes("manage_members");
  const isTreasurer = roleName === "Treasurer" || roleName === "TREASURER" || (myMembership?.role as any)?.permissions?.includes("manage_finances");

  const payouts = payoutsResponse?.data ?? [];
  const pendingEqubPayout = payouts.find(
    (p) => p.category === 'Equb_Payout' && p.status === 'PENDING_APPROVAL'
  );

  const approveAdminMutation = useMutation({
    mutationFn: () => financialService.approvePayoutAsAdmin(id, pendingEqubPayout!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-payouts", id] });
      queryClient.invalidateQueries({ queryKey: ["mahber-payouts-summary", id] });
      toast.success(t("approveSuccess"));
    },
    onError: (err: any) => toast.error(err.message || t("approveFailed")),
  });

  const approveTreasurerMutation = useMutation({
    mutationFn: () => financialService.approvePayoutAsTreasurer(id, pendingEqubPayout!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-payouts", id] });
      queryClient.invalidateQueries({ queryKey: ["mahber-payouts-summary", id] });
      toast.success(t("approveSuccess"));
    },
    onError: (err: any) => toast.error(err.message || t("approveFailed")),
  });

  return (
    <div className="space-y-8 pb-20">
      <PageHeader title={t('title')} description={t('description')}>
        <Link href={`/mahbers/${id}/payouts/create`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t('newPayout')}
          </Button>
        </Link>
      </PageHeader>

      {/* Pending Equb Payout Card */}
      {pendingEqubPayout && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background-dark">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary">
                  {t("pendingEqubTitle")}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {t("pendingEqubDesc")}
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-text-muted w-20">{t("winner")}:</span>
                    <span className="font-medium text-text-primary">{pendingEqubPayout.member?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-text-muted w-20">{t("amount")}:</span>
                    <span className="font-semibold text-text-primary">ETB {pendingEqubPayout.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    {pendingEqubPayout.approved_by_admin ? (
                      <><CheckCircle className="w-4 h-4 text-green-500" /> Admin — {t("approved")}</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-amber-500" /> Admin — {t("pending")}</>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {pendingEqubPayout.approved_by_treasurer ? (
                      <><CheckCircle className="w-4 h-4 text-green-500" /> Treasurer — {t("approved")}</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-amber-500" /> Treasurer — {t("pending")}</>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {isAdmin && !pendingEqubPayout.approved_by_admin && (
                <Button
                  size="sm"
                  className="bg-gold hover:bg-gold-dark text-black font-semibold"
                  onClick={() => approveAdminMutation.mutate()}
                  disabled={approveAdminMutation.isPending}
                >
                  {approveAdminMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {t("approveAsAdmin")}
                </Button>
              )}
              {isTreasurer && !pendingEqubPayout.approved_by_treasurer && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                  onClick={() => approveTreasurerMutation.mutate()}
                  disabled={approveTreasurerMutation.isPending}
                >
                  {approveTreasurerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {t("approveAsTreasurer")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-gold/10 to-background-dark">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{t('totalPayouts')}</p>
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
                  <p className="text-sm text-text-secondary">{t('count')}</p>
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
                  <p className="text-sm text-text-secondary">{t('recipients')}</p>
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
                  <p className="text-sm text-text-secondary">{t('categories')}</p>
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
              {t('byCategory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {summary.category_breakdown.map((cat) => (
                <div
                  key={cat.category}
                  className={`rounded-lg px-4 py-3 ${categoryColors[cat.category] || "text-text-secondary bg-background-dark/50"}`}
                >
                  <p className="text-xs font-medium opacity-75">
                    {categoryLabels[cat.category] || cat.category}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    ETB {cat.amount.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-60">{t('payoutsCount', { count: cat.count })}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle className="text-sm font-medium text-text-primary">
              {t('payoutHistory')}
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
              <p className="text-text-secondary">{t('noPayouts')}</p>
              <Link href={`/mahbers/${id}/payouts/create`}>
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <Plus className="w-3 h-3" />
                  {t('createFirstPayout')}
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
                        {payout.member?.name ?? t('unknownMember')}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {payout.reason}
                      </p>
                      <span
                        className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1 ${statusColors[payout.status] || "text-text-muted bg-background-dark/50"}`}
                      >
                        {payout.status === 'PENDING_APPROVAL' ? t('statusPending') :
                         payout.status === 'APPROVED' ? t('statusApproved') :
                         payout.status === 'PAID' ? t('statusPaid') :
                         payout.status === 'REJECTED' ? t('statusRejected') :
                         payout.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">
                      ETB {payout.amount.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${categoryColors[payout.category] || "text-text-muted bg-background-dark/50"}`}
                    >
                      {categoryLabels[payout.category] || payout.category}
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
