"use client";

import { useQuery } from "@tanstack/react-query";
import { use, useState, useEffect, useCallback } from "react";
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
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Receipt,
} from "lucide-react";
import { auditService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import type { AuditTrailEntry } from "@/lib/types";

const ENTITY_COLORS: Record<string, string> = {
  payment: "#22c55e",
  fine: "#eab308",
  membership: "#3b82f6",
  lottery: "#a855f7",
  mahber: "#f97316",
  expense: "#ef4444",
  system: "#6b7280",
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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

  // ── Pagination, search, filter, sort state ──
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [sortField, setSortField] = useState<"date" | "entity_type" | "action">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const onFilterChange = useCallback(
    (updates: Partial<{ entityType: string; sortField: "date" | "entity_type" | "action"; sortOrder: "asc" | "desc" }>) => {
      if (updates.entityType !== undefined) setEntityTypeFilter(updates.entityType);
      if (updates.sortField !== undefined) setSortField(updates.sortField);
      if (updates.sortOrder !== undefined) setSortOrder(updates.sortOrder);
      setPage(1);
    },
    [],
  );

  // ── Queries ──
  const {
    data: auditResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["mahber-audit-trail", id, page, search, entityTypeFilter, sortField, sortOrder],
    queryFn: () =>
      auditService.getAuditTrail(id, {
        page,
        limit,
        search: search || undefined,
        entity_type: entityTypeFilter || undefined,
        sort: sortField,
        order: sortOrder,
      }),
  });

  const entries = auditResponse?.data ?? [];
  const { total = 0, totalPages = 0 } = auditResponse?.meta || {};

  // All entries (unpaginated) for stat totals
  const { data: allData } = useQuery({
    queryKey: ["mahber-audit-trail-all", id],
    queryFn: () => auditService.getAuditTrail(id, { page: 1, limit: 1000 }),
    staleTime: 10_000,
    refetchOnMount: true,
  });

  const allEntries = allData?.data ?? [];
  const totalEntries = allEntries.length;
  const paymentCount = allEntries.filter((e) => e.entity_type === "payment").length;
  const fineCount = allEntries.filter((e) => e.entity_type === "fine").length;
  const expenseCount = allEntries.filter((e) => e.entity_type === "expense").length;

  // ── Chart data ──
  const entityDistribution = Object.entries(
    allEntries.reduce<Record<string, number>>((acc, e) => {
      acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, value]) => ({
      label,
      value,
      color: ENTITY_COLORS[label] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);

  const now = new Date();
  const monthlyActivity = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = `${MONTHS_SHORT[month]} ${String(year).slice(2)}`;
    const count = allEntries.filter((e) => {
      const created = new Date(e.created_at);
      return (
        created.getFullYear() === year && created.getMonth() === month
      );
    }).length;
    return { label, value: count };
  });

  // ── Sort helpers ──
  const sortOptions: { label: string; field: "date" | "entity_type" | "action"; order: "asc" | "desc" }[] = [
    { label: "Newest", field: "date", order: "desc" },
    { label: "Oldest", field: "date", order: "asc" },
    { label: "Type A-Z", field: "entity_type", order: "asc" },
    { label: "Type Z-A", field: "entity_type", order: "desc" },
    { label: "Action A-Z", field: "action", order: "asc" },
    { label: "Action Z-A", field: "action", order: "desc" },
  ];

  const activeSortLabel =
    sortOptions.find((o) => o.field === sortField && o.order === sortOrder)?.label || "Newest";

  // ── Pagination helpers ──
  const pageNumbers: (number | "...")[] = [];
  if (totalPages > 0) {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }
    if (page < totalPages - 2) pageNumbers.push("...");
    if (totalPages > 1) pageNumbers.push(totalPages);
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Audit Log" description="Failed to load audit data." />
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
        description={`Audit trail for this Mahber (${totalEntries} total entries).`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Entries</p>
              <p className="text-2xl font-bold text-text-primary">{totalEntries}</p>
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
              <p className="text-2xl font-bold text-text-primary">{paymentCount}</p>
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
              <p className="text-2xl font-bold text-text-primary">{fineCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-status-error" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Expense Actions</p>
              <p className="text-2xl font-bold text-text-primary">{expenseCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {allEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-text-secondary">
                Activity (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={monthlyActivity} height={160} barWidth={28} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-text-secondary">
                Entries by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <DonutChart data={entityDistribution} size={170} innerRadius={58} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search, Filter, Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by type, action, entity..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-background-dark/50 border border-border-glass rounded-input text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto">
          {/* Entity type filter */}
          <div className="flex items-center gap-1 bg-background-dark/50 border border-border-glass rounded-input px-1 py-1">
            {(["", "payment", "fine", "membership", "lottery", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onFilterChange({ entityType: t })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  entityTypeFilter === t
                    ? "bg-gold text-black"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-background-dark/50 border border-border-glass rounded-input text-sm text-text-secondary hover:text-text-primary transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{activeSortLabel}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-surface-card border border-border-glass rounded-card shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {sortOptions.map((opt) => (
                <button
                  key={`${opt.field}-${opt.order}`}
                  onClick={() => onFilterChange({ sortField: opt.field, sortOrder: opt.order })}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-card last:rounded-b-card ${
                    sortField === opt.field && sortOrder === opt.order
                      ? "bg-gold/10 text-gold"
                      : "text-text-secondary hover:bg-surface-active"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-card" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-text-secondary">
              {search || entityTypeFilter
                ? "No audit entries match your search."
                : "No audit trail entries found."}
            </p>
            {(search || entityTypeFilter) && (
              <Button
                variant="ghost"
                className="mt-3 text-sm"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setEntityTypeFilter("");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
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
                    <p className="text-text-primary break-all">{entry.entity_id}</p>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 pb-2">
              <p className="text-sm text-text-muted">
                Page {page} of {totalPages} ({total} entries)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-text-muted text-sm">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      disabled={isFetching}
                      className={`h-8 min-w-[2rem] px-2 rounded-md text-sm font-medium transition-colors ${
                        page === p
                          ? "bg-gold text-black"
                          : "text-text-secondary hover:bg-surface-active"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
