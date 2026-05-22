"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { mahberService, financialService } from "@/lib/api/service-factory";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const queryClient = useQueryClient();

  const { data: mahbers, isLoading } = useQuery({
    queryKey: ["mahbers"],
    queryFn: () => mahberService.getMahbers(),
  });

  const { data: invitations } = useQuery({
    queryKey: ["invitations"],
    queryFn: () => mahberService.getInvitations(),
  });

  const respondMutation = useMutation({
    mutationFn: (data: { requestId: string; action: "accept" | "reject" }) =>
      mahberService.respondToInvitation(data.requestId, data.action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["mahbers"] });
      if (variables.action === "accept") {
        toast.success(t("acceptSuccess"));
      } else {
        toast.success(t("rejectSuccess"));
      }
    },
    onError: () => {
      toast.error(t("respondError"));
    },
  });

  const { data: pendingCount, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["pendingPaymentsCount", mahbers],
    queryFn: async () => {
      if (!mahbers || mahbers.length === 0) return 0;

      const allPaymentsResults = await Promise.all(
        mahbers.map((mahber) => financialService.getMahberPayments(mahber.id))
      );

      let count = 0;
      for (const res of allPaymentsResults) {
        if (res?.data) {
          const pendingForMahber = res.data.filter((p) => p.status === "Pending");
          count += pendingForMahber.length;
        }
      }
      return count;
    },
    enabled: !!mahbers && mahbers.length > 0,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-text-primary tracking-tight">{t("title")}</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass glass-hover rounded-card p-8 group transition-all duration-500 flex flex-col justify-between min-h-[160px]">
          <div>
            <h3 className="text-text-secondary font-medium tracking-wide uppercase text-xs mb-1">{t("activeMahbers")}</h3>
            {isLoading ? (
              <Skeleton className="h-10 w-16 my-1 bg-gold/10" />
            ) : (
              <p className="text-4xl font-bold text-gold group-hover:scale-110 transition-transform duration-500 origin-left mb-4">
                {mahbers?.length || 0}
              </p>
            )}
          </div>

          {!isLoading && mahbers && mahbers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gold/10 space-y-2">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">{t("yourCommunities")}</p>
              <div className="flex flex-wrap gap-2">
                {mahbers.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mahbers/${m.id}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gold/5 text-gold border border-gold/10 hover:bg-gold/20 transition-colors"
                  >
                    {m.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass glass-hover rounded-card p-8 group transition-all duration-500 min-h-[160px]">
          <h3 className="text-text-secondary font-medium tracking-wide uppercase text-xs mb-1">{t("paymentReminder")}</h3>
          {isLoading || isPaymentsLoading ? (
            <Skeleton className="h-10 w-16 my-1 bg-gold/10" />
          ) : (
            <p className="text-4xl font-bold text-status-warning group-hover:scale-110 transition-transform duration-500 origin-left">
              {pendingCount ?? 0}
            </p>
          )}
        </div>
      </div>

      {/* Invitation Requests — shown at the bottom */}
      <div className="glass rounded-card p-8 shadow-xl shadow-gold/5">
        <h2 className="text-2xl font-semibold mb-2 text-text-primary">{t("invitationRequests")}</h2>
        <p className="text-sm text-text-secondary mb-6">{t("invitationRequestsDesc")}</p>

        {!invitations ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-10 rounded-input border border-border-glass">
            <p className="text-text-muted text-sm">{t("noInvitations")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-input border border-gold/20 hover:border-gold/40 transition-colors"
              >
                <div>
                  <p className="font-semibold text-text-primary">{invitation.mahber?.name}</p>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">
                    {invitation.mahber?.type}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{t("invitedYou")}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => respondMutation.mutate({ requestId: invitation.id, action: "accept" })}
                    disabled={respondMutation.isPending}
                    className="bg-gold hover:bg-gold-dark text-black text-xs font-semibold px-5"
                  >
                    {respondMutation.isPending &&
                    respondMutation.variables?.requestId === invitation.id &&
                    respondMutation.variables?.action === "accept" ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-black border-t-transparent" />
                    ) : (
                      t("accept")
                    )}
                  </Button>
                  <Button
                    onClick={() => respondMutation.mutate({ requestId: invitation.id, action: "reject" })}
                    disabled={respondMutation.isPending}
                    variant="outline"
                    className="text-xs font-semibold px-5 border border-border-glass hover:bg-surface-active"
                  >
                    {respondMutation.isPending &&
                    respondMutation.variables?.requestId === invitation.id &&
                    respondMutation.variables?.action === "reject" ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-text-primary border-t-transparent" />
                    ) : (
                      t("decline")
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
