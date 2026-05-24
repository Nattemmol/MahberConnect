"use client";

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
      toast.error("Unable to start checkout.");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Unable to process payment. Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Confirm Payment"
          description="Review the system-calculated amount before checkout."
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
          title="All Paid Up"
          description="You have no outstanding payments at this time."
        />
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="h-12 w-12 text-status-success" />
            <p className="text-text-secondary">
              You have no outstanding payments at this time.
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
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
        title="Confirm Payment"
        description="Review the system-calculated obligations. Amounts are read-only."
      />

      <Card className="border-gold/30 bg-gold/5">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 border border-gold/30 bg-background/60 rounded-xl">
            <CreditCard className="h-10 w-10 text-gold" />
            <div className="flex-1">
              <p className="font-semibold text-text-primary">
                Secure checkout via Chapa
              </p>
              <p className="text-sm text-text-secondary">
                The system has calculated your total. You only need to confirm.
              </p>
            </div>
            {outstanding.has_pending_payment && (
              <Badge variant="warning">Payment in progress</Badge>
            )}
          </div>

          {outstanding.has_pending_payment && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-status-warning/30 bg-status-warning/10 text-sm text-text-secondary">
              <CircleAlert className="h-5 w-5 text-status-warning mt-0.5" />
              <p>
                You already have a pending payment in progress. Please wait for
                it to complete before starting another one.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border-glass">
              <span className="text-text-secondary">Contribution</span>
              <span className="font-semibold">
                {contributionDue.toLocaleString()} ETB
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border-glass">
              <span className="text-text-secondary">Late fines</span>
              <span className="font-semibold">
                {fineTotal.toLocaleString()} ETB{" "}
                {pendingFineCount > 0 ? `(${pendingFineCount} pending)` : ""}
              </span>
            </div>

            <div className="flex items-center justify-between py-4 text-lg font-bold">
              <span>Total due</span>
              <span className="text-gold">
                {outstanding.total_outstanding.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {pendingFineCount > 0 && (
            <div className="space-y-3">
              <p className="font-medium text-text-primary">Fine line items</p>
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
                        Issued {new Date(fine.issued_at).toLocaleDateString()}
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
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={outstanding.has_pending_payment}
              isLoading={false}
            >
              Pay Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
