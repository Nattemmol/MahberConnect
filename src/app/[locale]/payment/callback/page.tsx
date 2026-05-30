"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tx_ref = searchParams.get("tx_ref") ?? searchParams.get("trx_ref");
  const statusParam = searchParams.get("status");
  const mahberIdParam = searchParams.get("mahber_id");

  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying",
  );
  const [mahberId, setMahberId] = useState<string | null>(mahberIdParam);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[PaymentCallback] URL params", {
      tx_ref,
      statusParam,
      mahberIdParam,
      rawSearch: searchParams.toString(),
    });

    if (!tx_ref) {
      // eslint-disable-next-line no-console
      console.warn("[PaymentCallback] Missing tx_ref / trx_ref");
      setStatus("failed");
      return;
    }

    // The backend browser callback already reconciled with Chapa before redirecting here.
    // The status param reflects the actual reconciliation result.
    if (statusParam === "success") {
      setStatus("success");
      if (mahberIdParam) setMahberId(mahberIdParam);
    } else {
      setStatus("failed");
    }
  }, [tx_ref, statusParam, mahberIdParam]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border-glass">
        <CardContent className="pt-10 flex flex-col items-center text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 text-gold animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Verifying Payment
              </h2>
              <p className="text-text-secondary">
                Please wait while we confirm your transaction with Chapa...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-12 h-12 text-status-success" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Payment Successful!
              </h2>
              <p className="text-text-secondary mb-1">
                Your payment has been confirmed and recorded.
              </p>
              {tx_ref && (
                <p className="text-xs text-text-muted font-mono mt-2">
                  Ref: {tx_ref.slice(0, 20)}...
                </p>
              )}
            </>
          )}

          {status === "failed" && (
            <>
              <div className="w-20 h-20 rounded-full bg-status-error/20 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                <XCircle className="w-12 h-12 text-status-error" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Payment Failed
              </h2>
              <p className="text-text-secondary">
                We couldn&apos;t confirm your transaction. Please try again or
                contact support if the issue persists.
              </p>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pb-8 pt-4 px-6">
          {status === "success" && (
            <>
              <Button
                onClick={() =>
                  router.push(
                    mahberId
                      ? `/mahbers/${mahberId}/payments`
                      : "/dashboard",
                  )
                }
                className="w-full"
              >
                Go to Finances
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <Button
                onClick={() =>
                  router.push(
                    mahberId
                      ? `/mahbers/${mahberId}`
                      : "/mahbers/discover",
                  )
                }
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
