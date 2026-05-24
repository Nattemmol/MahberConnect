"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import {
  Calendar,
  CircleAlert,
  ShieldCheck,
  User,
  Wallet,
  ArrowRightLeft,
  Hash,
  CreditCard,
  BadgeCheck,
} from "lucide-react";
import { auditService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditTrailEntry } from "@/lib/types";

const HIGHLIGHT_KEYS = [
  "status",
  "amount",
  "payment_type",
  "tx_ref",
  "chapa_reference",
  "reference",
  "currency",
  "payment_method",
  "fine_ids",
  "period_start",
  "period_end",
];

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatScalar(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  return "Available";
}

function summarizeValue(value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(
        ([key, item]) =>
          HIGHLIGHT_KEYS.includes(key) && item !== undefined && item !== null,
      )
      .slice(0, 4)
      .map(([key, item]) => `${humanizeKey(key)}: ${formatScalar(item)}`);

    return entries.length > 0 ? entries.join(" • ") : "Available";
  }

  return formatScalar(value);
}

function buildFieldRows(value?: Record<string, unknown> | null) {
  if (!value) return [];

  return Object.entries(value)
    .filter(
      ([key, item]) =>
        HIGHLIGHT_KEYS.includes(key) && item !== undefined && item !== null,
    )
    .map(([key, item]) => ({
      key,
      label: humanizeKey(key),
      value: Array.isArray(item)
        ? item.length > 0
          ? item.join(", ")
          : "None"
        : typeof item === "object"
          ? summarizeValue(item)
          : formatScalar(item),
    }));
}

function DetailGrid({
  title,
  value,
}: {
  title: string;
  value?: Record<string, unknown> | null;
}) {
  const rows = buildFieldRows(value);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-glass bg-background/50 p-4 space-y-3">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-lg border border-border-glass/70 bg-background/60 p-3"
          >
            <p className="text-[11px] uppercase tracking-wide text-text-muted">
              {row.label}
            </p>
            <p className="text-sm text-text-primary mt-1 break-words">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangeSummary({ entry }: { entry: AuditTrailEntry }) {
  const oldValue = (entry.old_value ?? null) as Record<string, unknown> | null;
  const newValue = (entry.new_value ?? null) as Record<string, unknown> | null;
  const metadata = (entry.metadata ?? null) as Record<string, unknown> | null;

  if (!oldValue && !newValue && !metadata) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-border-glass bg-background/50 p-3">
          <p className="text-text-muted mb-1 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transition
          </p>
          <p className="text-text-primary break-words">
            {formatScalar(oldValue?.status)} → {formatScalar(newValue?.status)}
          </p>
        </div>

        <div className="rounded-lg border border-border-glass bg-background/50 p-3">
          <p className="text-text-muted mb-1 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" />
            Reference
          </p>
          <p className="text-text-primary break-words">
            {formatScalar(
              newValue?.tx_ref ?? metadata?.tx_ref ?? entry.entity_id,
            )}
          </p>
        </div>
      </div>

      <DetailGrid
        title="Payment details"
        value={newValue ?? oldValue ?? metadata}
      />

      {metadata && metadata.webhook_payload ? (
        <div className="rounded-xl border border-border-glass bg-background/50 p-4 space-y-2">
          <p className="text-sm font-medium text-text-primary flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-status-success" />
            Webhook snapshot
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-border-glass/70 bg-background/60 p-3">
              <p className="text-text-muted mb-1">Status</p>
              <p className="text-text-primary">
                {formatScalar(
                  (metadata.webhook_payload as Record<string, unknown>).status,
                )}
              </p>
            </div>
            <div className="rounded-lg border border-border-glass/70 bg-background/60 p-3">
              <p className="text-text-muted mb-1">Amount</p>
              <p className="text-text-primary">
                {formatScalar(
                  (metadata.webhook_payload as Record<string, unknown>).amount,
                )}{" "}
                ETB
              </p>
            </div>
            <div className="rounded-lg border border-border-glass/70 bg-background/60 p-3">
              <p className="text-text-muted mb-1">Reference</p>
              <p className="text-text-primary break-all">
                {formatScalar(
                  (metadata.webhook_payload as Record<string, unknown>)
                    .reference,
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FinancialAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["mahber-audit-trail", id],
    queryFn: () => auditService.getAuditTrail(id, { limit: 100 }),
  });

  const entries = data?.data ?? [];
  const paymentEntries = entries.filter(
    (entry) => entry.entity_type === "payment",
  );
  const fineEntries = entries.filter((entry) => entry.entity_type === "fine");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Audit Log" description="Loading..." />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Financial Audit Log"
          description="Failed to load audit data."
        />
        <Card>
          <CardContent className="p-6 text-text-secondary">
            Unable to load the audit trail.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Financial Audit Log"
        description={`Recent audit trail entries for this Mahber (${entries.length} total).`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Entries</p>
              <p className="text-2xl font-bold text-text-primary">
                {entries.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-status-success/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Payment Actions</p>
              <p className="text-2xl font-bold text-text-primary">
                {paymentEntries.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-status-warning/10 flex items-center justify-center">
              <CircleAlert className="w-6 h-6 text-status-warning" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Fine Actions</p>
              <p className="text-2xl font-bold text-text-primary">
                {fineEntries.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-text-secondary">
            No audit trail entries found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry: AuditTrailEntry) => (
            <Card
              key={entry.id}
              className="hover:bg-surface-hover/50 transition-colors"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  <span className="capitalize">
                    {entry.action.replace(/_/g, " ")}
                  </span>
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {entry.entity_type}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-text-secondary">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {entry.actor?.name ?? "System"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border-glass bg-background/50 p-3">
                    <p className="text-text-muted mb-1 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      Entity ID
                    </p>
                    <p className="text-text-primary break-all">
                      {entry.entity_id}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border-glass bg-background/50 p-3">
                    <p className="text-text-muted mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Actor ID
                    </p>
                    <p className="text-text-primary break-all">
                      {entry.actor_id ?? "System"}
                    </p>
                  </div>
                </div>

                <ChangeSummary entry={entry} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
