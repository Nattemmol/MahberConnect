"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, ShieldBan, Filter } from "lucide-react";
import { financialService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { use, useState } from "react";

export default function FinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Fines");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "waived">(
    "all",
  );

  const { data: fines, isLoading } = useQuery({
    queryKey: ["mahber-fines", id],
    queryFn: () => financialService.getFines(id),
  });

  const waiveMutation = useMutation({
    mutationFn: (fineId: string) => financialService.waiveFine(id, fineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-fines", id] });
      toast.success(t("waiveSuccess"));
    },
    onError: () => toast.error(t("waiveFailed")),
  });

  const filteredFines =
    fines?.data?.filter((f) => filter === "all" || f.status === filter) || [];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-status-error text-white",
          icon: AlertCircle,
          label: t("pending"),
        };
      case "paid":
        return {
          color: "bg-status-success text-white",
          icon: CheckCircle2,
          label: t("paid"),
        };
      case "waived":
        return {
          color: "bg-text-muted text-background-dark",
          icon: ShieldBan,
          label: t("waived"),
        };
      default:
        return {
          color: "bg-surface-active text-text-primary",
          icon: AlertCircle,
          label: status,
        };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="whitespace-nowrap"
        >
          {t("allFines")}
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
          className={`whitespace-nowrap ${filter === "pending" ? "bg-status-error text-white border-status-error" : "border-border-glass text-text-secondary hover:text-text-primary"}`}
        >
          {t("pending")}
        </Button>
        <Button
          variant={filter === "paid" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("paid")}
          className={`whitespace-nowrap ${filter === "paid" ? "bg-status-success text-white border-status-success" : "border-border-glass text-text-secondary hover:text-text-primary"}`}
        >
          {t("paid")}
        </Button>
        <Button
          variant={filter === "waived" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("waived")}
          className={`whitespace-nowrap ${filter === "waived" ? "bg-text-muted text-background-dark border-text-muted" : "border-border-glass text-text-secondary hover:text-text-primary"}`}
        >
          {t("waived")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      ) : filteredFines.length === 0 ? (
        <div className="text-center py-16 glass rounded-card">
          <ShieldBan className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary text-lg">
            {t("noFinesFound")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFines.map((fine) => {
            const StatusIcon = getStatusConfig(fine.status).icon;
            return (
              <Card key={fine.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-text-primary">
                          {fine.member?.name || t("unknownMember")}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {fine.reason}
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className={getStatusConfig(fine.status).color}
                      >
                        {getStatusConfig(fine.status).label}
                      </Badge>
                    </div>

                    <div className="mt-auto pt-4 border-t border-border-glass flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gold">
                          {fine.amount.toLocaleString()} ETB
                        </span>
                        <span className="text-xs text-text-muted">
                          {t("issued", { date: new Date(fine.issued_at).toLocaleDateString() })}
                        </span>
                      </div>

                      {fine.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border-glass text-text-secondary hover:text-text-primary hover:bg-surface-active"
                          isLoading={
                            waiveMutation.isPending &&
                            waiveMutation.variables === fine.id
                          }
                          onClick={() => waiveMutation.mutate(fine.id)}
                        >
                          {t("waiveFine")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
