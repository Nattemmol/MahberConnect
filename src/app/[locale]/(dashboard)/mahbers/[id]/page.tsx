"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { use } from "react";
import Link from "next/link";
import {
  mahberService,
  memberService,
  financialService,
} from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, Trophy, CircleAlert, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "@/lib/stores/auth-store";

export default function MahberOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("MahberOverview");
  const { id } = use(params);
  const { user } = useAuthStore();

  const { data: mahber, isLoading: isMahberLoading } = useQuery({
    queryKey: ["mahber", id],
    queryFn: () => mahberService.getMahberById(id),
  });

  const { data: myMahbers, isLoading: isMyMahbersLoading } = useQuery({
    queryKey: ["my-mahbers"],
    queryFn: () => mahberService.getMahbers(),
  });

  const isMember =
    Array.isArray(myMahbers) && myMahbers.some((m) => m.id === id);
  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
    enabled: isMember,
  });

  const myMembership = membersResponse?.data?.find(
    (m) => m.user?.id === user?.id,
  );
  const isAdmin =
    (myMembership?.role as any) === "ADMIN" ||
    (myMembership?.role as any) === "Admin" ||
    (myMembership?.role as any)?.name === "Admin" ||
    (myMembership?.role as any)?.name === "ADMIN" ||
    (myMembership?.role as any)?.permissions?.includes("manage_members") ||
    (myMembership?.role as any)?.permissions?.includes("manage_finances");

  const isLoading = isMahberLoading || isMyMahbersLoading;

  const contributionAmount =
    typeof mahber?.configuration?.contribution_amount === "number"
      ? mahber.configuration.contribution_amount
      : null;

  const cycle =
    typeof mahber?.configuration?.cycle === "string"
      ? mahber.configuration.cycle
      : null;

  const displayCycle = cycle
    ? `${cycle.charAt(0).toUpperCase()}${cycle.slice(1)}`
    : "—";
  const paymentFrequency =
    typeof mahber?.configuration?.payment_frequency === "string"
      ? mahber.configuration.payment_frequency
      : displayCycle;

  const outstandingQuery = useQuery({
    queryKey: ["mahber-outstanding", id],
    queryFn: () => financialService.getOutstanding(id),
    enabled: isMember,
  });

  const outstanding = outstandingQuery.data;
  const outstandingTotal = outstanding?.total_outstanding ?? 0;
  const pendingFineCount = outstanding?.pending_fines?.length ?? 0;
  const hasPendingPayment = outstanding?.has_pending_payment ?? false;
  const hasOutstandingPayment = outstandingTotal > 0 || hasPendingPayment;

  const retryMutation = useMutation({
    mutationFn: () => financialService.initiatePayment({ mahber_id: id }),
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error(t('unableToCheckout'));
      }
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          t('paymentFailed'),
      );
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('loadingDesc')} />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((index) => (
            <Card key={index}>
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!mahber) {
    return (
      <div className="text-center py-20 glass rounded-card">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          {t('notFound')}
        </h3>
        <p className="text-text-secondary mb-6">
          {t('notFoundDesc')}
        </p>
        <Button asChild>
          <Link href="/mahbers">{t('backToMahbers')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isMember && hasOutstandingPayment && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-gold/30 bg-gold/5 rounded-input mb-6">
          <div className="flex items-center gap-3">
            {hasPendingPayment ? (
              <CircleAlert className="w-6 h-6 text-status-warning flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gold flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-text-primary">
                {hasPendingPayment
                  ? t('paymentInProgress')
                  : t('outstandingDue')}
              </p>
              <p className="text-sm text-text-secondary">
                {hasPendingPayment
                  ? t('paymentInProgressDesc', { amount: outstanding?.pending_payment_amount ?? 0 })
                  : t('outstandingDesc', { amount: outstandingTotal.toLocaleString(), fines: pendingFineCount > 0 ? t('pendingFineCount', { count: pendingFineCount }) : "" })}
              </p>
            </div>
          </div>
          {hasPendingPayment ? (
            <Button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              variant="outline"
              className="flex-shrink-0 font-medium"
            >
              {retryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t('retryPayment')}
            </Button>
          ) : (
            <Button
              asChild
              className="bg-gold hover:bg-gold/80 text-black flex-shrink-0 font-medium"
            >
              <Link href={`/mahbers/${id}/payments/initiate`}>{t('payNow')}</Link>
            </Button>
          )}
        </div>
      )}

      {!isMember && (
        <div className="flex items-center gap-4 p-4 border border-gold/30 bg-gold/5 rounded-input mb-6">
          <Clock className="w-8 h-8 text-gold" />
          <div>
            <p className="font-semibold text-text-primary">
              {t('joinRequestPending')}
            </p>
            <p className="text-xs text-text-secondary">
              {t('joinRequestPendingDesc')}
            </p>
          </div>
        </div>
      )}

      <PageHeader
        title={mahber.name}
        description="Mahber overview and configuration."
      >
        <div className="flex flex-wrap gap-2">
          {isMember && (
            <>
              <Button asChild variant="outline">
                <Link href={`/mahbers/${id}/members`}>{t('members')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/mahbers/${id}/payments`}>{t('payments')}</Link>
              </Button>
              {mahber.type === "EQUB" && (
                <Button
                  asChild
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 gap-2"
                >
                  <Link href={`/mahbers/${id}/lottery`}>
                    <Trophy className="w-4 h-4" />
                    {t('lotteryDraw')}
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <Button
                  asChild
                  variant="default"
                  className="bg-gold hover:bg-gold-dark text-black"
                >
                  <Link href={`/mahbers/${id}/settings`}>{t('settings')}</Link>
                </Button>
              )}
            </>
          )}
          {!isMember && (
            <Badge variant="warning" className="px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {t('pendingApproval')}
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('summary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  mahber.type === "EQUB"
                    ? "success"
                    : mahber.type === "IDDIR"
                      ? "warning"
                      : "default"
                }
              >
                {mahber.type}
              </Badge>
              <Badge variant={mahber.is_public ? "outline" : "secondary"}>
                {mahber.is_public ? "Public" : "Private"}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-text-secondary">{t('invitationCode')}</p>
              <p className="text-base text-text-primary">
                {mahber.invitation_code || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">{t('created')}</p>
              <p className="text-base text-text-primary">
                {new Date(mahber.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">{t('lastUpdated')}</p>
              <p className="text-base text-text-primary">
                {new Date(mahber.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('configuration')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary">{t('contributionAmount')}</p>
              <p className="text-base text-text-primary">
                {contributionAmount ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">{t('cycle')}</p>
              <p className="text-base text-text-primary">{displayCycle}</p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">{t('joinFee')}</p>
              <p className="text-base text-text-primary">
                {mahber.configuration?.join_fee_required
                  ? `${mahber.configuration?.join_fee_amount ?? 0} ETB`
                  : t('notRequired')}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">{t('paymentFrequency')}</p>
              <p className="text-base text-text-primary">{paymentFrequency}</p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">{t('penaltyRules')}</p>
              <p className="text-base text-text-primary">
                {mahber.configuration?.penalty_rate ?? 0}{" "}
                {mahber.configuration?.penalty_mode ?? "fixed"}
                {mahber.configuration?.penalty_interval
                  ? ` every ${mahber.configuration.penalty_interval}`
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
