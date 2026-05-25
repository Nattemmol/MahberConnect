"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { financialService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, CircleAlert, CheckCircle2 } from "lucide-react";

export default function ConfirmPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("ConfirmPayment");

  const { data: outstanding, isLoading } = useQuery({
    queryKey: ["mahber-outstanding", id],
    queryFn: () => financialService.getOutstanding(id),
  });

  const handleConfirm = async () => {
    try {
      const result = await financialService.initiatePayment({ mahber_id: id });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      toast.error(t('checkoutFailed'));
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          t('paymentFailed'),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
        />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!outstanding || outstanding.total_outstanding <= 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('allPaidUp')}
          description={t('allPaidUpDesc')}
        />
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="h-12 w-12 text-status-success" />
            <p className="text-text-secondary">
              {t('allPaidUpDesc')}
            </p>
            <Button onClick={() => router.back()}>{t('goBack')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contributionDue = outstanding.contribution_due ?? 0;
  const fineTotal = outstanding.pending_fines.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const pendingFineCount = outstanding.pending_fines.length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <Card className="border-gold/30 bg-gold/5">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 border border-gold/30 bg-background/60 rounded-xl">
            <CreditCard className="h-10 w-10 text-gold" />
            <div className="flex-1">
              <p className="font-semibold text-text-primary">
                {t('secureCheckout')}
              </p>
              <p className="text-sm text-text-secondary">
                {t('checkoutDesc')}
              </p>
            </div>
            {outstanding.has_pending_payment && (
              <Badge variant="warning">{t('paymentInProgress')}</Badge>
            )}
          </div>

          {outstanding.has_pending_payment && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-status-warning/30 bg-status-warning/10 text-sm text-text-secondary">
              <CircleAlert className="h-5 w-5 text-status-warning mt-0.5 shrink-0" />
              <p>
                {t('pendingPaymentWarning')}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border-glass">
              <span className="text-text-secondary">{t('contribution')}</span>
              <span className="font-semibold">
                {contributionDue.toLocaleString()} ETB
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border-glass">
              <span className="text-text-secondary">{t('lateFines')}</span>
              <span className="font-semibold">
                {fineTotal.toLocaleString()} ETB{" "}
                {pendingFineCount > 0 ? t('pendingFineCount', { count: pendingFineCount }) : ""}
              </span>
            </div>

            <div className="flex items-center justify-between py-4 text-lg font-bold">
              <span>{t('totalDue')}</span>
              <span className="text-gold">
                {outstanding.total_outstanding.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {pendingFineCount > 0 && (
            <div className="space-y-3">
              <p className="font-medium text-text-primary">{t('fineLineItems')}</p>
              <div className="space-y-2">
                {outstanding.pending_fines.map((fine) => (
                  <div
                    key={fine.id}
                    className="flex items-center justify-between rounded-lg border border-border-glass bg-background/40 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {fine.reason}
                      </p>
                      <p className="text-text-secondary">
                        {t('issued', { date: new Date(fine.issued_at).toLocaleDateString() })}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {fine.amount.toLocaleString()} ETB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => router.back()}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              variant={outstanding.has_pending_payment ? "outline" : "default"}
              isLoading={false}
            >
              {outstanding.has_pending_payment
                ? t('retryPayment')
                : t('payNow')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
