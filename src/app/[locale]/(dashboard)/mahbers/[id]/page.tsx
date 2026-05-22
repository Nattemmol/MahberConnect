"use client";

import { useQuery } from "@tanstack/react-query";
import { use, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { mahberService, memberService, financialService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, Trophy } from "lucide-react";

import { useAuthStore } from "@/lib/stores/auth-store";

export default function MahberOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const isMember = Array.isArray(myMahbers) && myMahbers.some(m => m.id === id);
  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
    enabled: isMember,
  });

  const myMembership = membersResponse?.data?.find(m => m.user?.id === user?.id);
  const isAdmin = (myMembership?.role as any) === "ADMIN" || 
                 (myMembership?.role as any) === "Admin" ||
                 (myMembership?.role as any)?.name === "Admin" ||
                 (myMembership?.role as any)?.name === "ADMIN" ||
                 (myMembership?.role as any)?.permissions?.includes("manage_members") ||
                 (myMembership?.role as any)?.permissions?.includes("manage_finances");

  const [isPaying, setIsPaying] = useState(false);

  const handlePayRecurring = async () => {
    try {
      setIsPaying(true);
      const res = await financialService.payRecurring(id);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        toast.error("Payment checkout URL not found.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const nextPaymentDue = myMembership?.next_payment_due;
  let isPaymentDueSoon = false;
  if (nextPaymentDue) {
    const dueDate = new Date(nextPaymentDue);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isPaymentDueSoon = diffDays <= 7;
  }

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mahber" description="Loading mahber details..." />
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
          Mahber Not Found
        </h3>
        <p className="text-text-secondary mb-6">
          We couldn&apos;t load this mahber. It may have been removed or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/mahbers">Back to Mahbers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isMember && isPaymentDueSoon && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-gold/30 bg-gold/5 rounded-input mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-gold flex-shrink-0" />
            <div>
              <p className="font-semibold text-text-primary">
                Contribution due soon
              </p>
              <p className="text-sm text-text-secondary">
                Contribution of {contributionAmount ?? 0} ETB is due soon ({nextPaymentDue ? new Date(nextPaymentDue).toLocaleDateString() : "approaching"}).
              </p>
            </div>
          </div>
          <Button 
            onClick={handlePayRecurring} 
            isLoading={isPaying}
            className="bg-gold hover:bg-gold/80 text-black flex-shrink-0 font-medium"
          >
            Pay Now
          </Button>
        </div>
      )}

      {!isMember && (
        <div className="flex items-center gap-4 p-4 border border-gold/30 bg-gold/5 rounded-input mb-6">
          <Clock className="w-8 h-8 text-gold" />
          <div>
            <p className="font-semibold text-text-primary">
              Join Request Pending
            </p>
            <p className="text-xs text-text-secondary">
              You have requested to join this community. Some features will be available once your request is approved.
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
                <Link href={`/mahbers/${id}/members`}>Members</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/mahbers/${id}/payments`}>Payments</Link>
              </Button>
              {mahber.type === "EQUB" && (
                <Button asChild variant="outline" className="border-gold/50 text-gold hover:bg-gold/10 gap-2">
                  <Link href={`/mahbers/${id}/lottery`}>
                    <Trophy className="w-4 h-4" />
                    Lottery Draw
                  </Link>
                </Button>
              )}
              {isAdmin && (
                <Button asChild variant="default" className="bg-gold hover:bg-gold-dark text-black">
                  <Link href={`/mahbers/${id}/settings`}>Settings</Link>
                </Button>
              )}
            </>
          )}
          {!isMember && (
            <Badge variant="warning" className="px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Pending Approval
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
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
              <p className="text-sm text-text-secondary">Invitation Code</p>
              <p className="text-base text-text-primary">
                {mahber.invitation_code || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">Created</p>
              <p className="text-base text-text-primary">
                {new Date(mahber.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">Last Updated</p>
              <p className="text-base text-text-primary">
                {new Date(mahber.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary">Contribution Amount</p>
              <p className="text-base text-text-primary">
                {contributionAmount ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">Cycle</p>
              <p className="text-base text-text-primary">{displayCycle}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
