"use client";

import { useQuery } from "@tanstack/react-query";
import { use, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useMahberMembership } from "@/lib/hooks/use-mahber-membership";
import { AdvisorReadOnlyBanner } from "@/components/reports/advisor-read-only-banner";
import {
  UserPlus,
  Settings,
  Dices,
  ShieldBan,
  AlertCircle,
  Activity,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { auditService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AuditTrailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("AuditTrail");
  const { id } = use(params);
  const router = useRouter();
  const { canViewReports, isReadOnly, isSuccess, isLoading: membershipLoading } =
    useMahberMembership(id);

  useEffect(() => {
    if (isSuccess && !canViewReports) {
      router.replace(`/mahbers/${id}`);
    }
  }, [isSuccess, canViewReports, id, router]);

  const { data: auditResponse, isLoading } = useQuery({
    queryKey: ["mahber-audit", id],
    queryFn: () => auditService.getAuditTrail(id),
    enabled: canViewReports,
  });

  const logs = auditResponse?.data || [];

  const getActionConfig = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("MEMBER") || act.includes("JOIN_REQUEST")) {
      return {
        icon: UserPlus,
        color: "text-gold bg-gold/10",
        border: "border-gold/20",
      };
    }
    if (act.includes("LOTTERY")) {
      return {
        icon: Dices,
        color: "text-status-success bg-status-success/10",
        border: "border-status-success/20",
      };
    }
    if (act.includes("FINE") || act.includes("WAIVE")) {
      return {
        icon: ShieldBan,
        color: "text-status-error bg-status-error/10",
        border: "border-status-error/20",
      };
    }
    if (act.includes("SETTING") || act.includes("MAHBER") || act.includes("ROLE")) {
      return {
        icon: Settings,
        color: "text-text-primary bg-surface-active",
        border: "border-border-glass",
      };
    }
    return {
      icon: Activity,
      color: "text-text-secondary bg-surface-active",
      border: "border-border-glass",
    };
  };

  const formatDetails = (log: any) => {
    const details = log.new_value || log.metadata || {};
    if (Object.keys(details).length === 0) return t('performed', { action: log.action.replace(/_/g, " ") });
    
    try {
      return Object.entries(details)
        .filter(([key]) => !key.includes("id") && !key.includes("_at"))
        .map(([key, value]) => {
          const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
          return `${key.replace(/_/g, " ")}: ${displayValue}`;
        })
        .join(" • ");
    } catch {
      return JSON.stringify(details);
    }
  };

  if (membershipLoading || !canViewReports) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />
      {isReadOnly && <AdvisorReadOnlyBanner />}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 glass rounded-card">
          <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary text-lg">
            {t('noLogs')}
          </p>
        </div>
      ) : (
        <div className="relative border-l border-border-glass ml-6 md:ml-8 space-y-8 py-4">
          {logs.map((log) => {
            const config = getActionConfig(log.action);
            const Icon = config.icon;

            return (
              <div key={log.id} className="relative pl-8 md:pl-12 group">
                <div
                  className={`absolute -left-5 md:-left-6 p-2 rounded-full border bg-background-dark ${config.border} ${config.color} transition-transform group-hover:scale-110 z-10`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <Card className="hover:border-gold/30 transition-colors">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider opacity-70">
                            {log.entity_type}
                          </Badge>
                          <h4 className="font-bold text-text-primary capitalize">
                            {log.action.replace(/_/g, " ")}
                          </h4>
                        </div>
                        <span className="text-xs text-text-muted">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-sm text-text-secondary">
                        {formatDetails(log)}
                      </div>

                      <div className="pt-2 text-xs text-text-muted flex items-center gap-1">
                        {t('by', { name: log.actor?.name || t('systemAdmin') })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
