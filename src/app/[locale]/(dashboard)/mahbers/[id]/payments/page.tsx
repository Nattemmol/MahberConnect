"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  Trophy,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Receipt,
  PlusCircle,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  financialService,
  memberService,
  mahberService,
} from "@/lib/api/service-factory";
import { apiClient } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/auth-store";
import toast from 'react-hot-toast';
import type { PaymentType, Expense } from "@/lib/types";

type SortField = "date" | "amount" | "status";
type SortOrder = "asc" | "desc";

export default function PaymentsDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const t = useTranslations("Payments");

  // ── Pagination, search, filter, sort state ──
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "All">("All");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const limit = 10;
  const [tab, setTab] = useState<"payments" | "expenses">("payments");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  const onFilterChange = useCallback(
    (updates: Partial<{ type: PaymentType | "All"; sortField: SortField; sortOrder: SortOrder }>) => {
      if (updates.type !== undefined) setTypeFilter(updates.type);
      if (updates.sortField !== undefined) setSortField(updates.sortField);
      if (updates.sortOrder !== undefined) setSortOrder(updates.sortOrder);
      setPage(1);
    },
    [],
  );

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const downloadReceipt = useCallback(async (paymentId: string) => {
    try {
      const res = await apiClient.get(`/mahbers/${id}/payments/${paymentId}/receipt`, { responseType: 'blob' });
      const blob = res.data as Blob;
      downloadBlob(blob, `receipt-${paymentId.slice(0, 8)}.pdf`);
    } catch {
      // Silently handle — receipt endpoint will throw if payment not completed
    }
  }, [id, downloadBlob]);

  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const handleExportCsv = useCallback(async () => {
    setExporting('csv');
    try {
      const blob = await financialService.exportLedgerCsv(id);
      downloadBlob(blob, `financial-report-${id}-${Date.now()}.csv`);
    } catch {
      toast.error(t('exportCsvFailed'));
    } finally {
      setExporting(null);
    }
  }, [id, downloadBlob]);

  const handleExportPdf = useCallback(async () => {
    setExporting('pdf');
    try {
      const blob = await financialService.exportFinancialReportPdf(id);
      downloadBlob(blob, `financial-report-${id}-${Date.now()}.pdf`);
    } catch {
      toast.error(t('exportPdfFailed'));
    } finally {
      setExporting(null);
    }
  }, [id, downloadBlob]);

  // ── Queries ──
  const { data: mahber } = useQuery({
    queryKey: ["mahber", id],
    queryFn: () => mahberService.getMahberById(id),
  });

  const { data: myMahbers } = useQuery({
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

  const { data: outstanding } = useQuery({
    queryKey: ["mahber-outstanding", id],
    queryFn: () => financialService.getOutstanding(id),
    enabled: Boolean(myMembership),
  });

  const isPaymentInProgress = outstanding?.has_pending_payment ?? false;
  const hasOutstanding =
    (outstanding?.total_outstanding ?? 0) > 0 || isPaymentInProgress;

  const isAdmin = membersResponse
    ? (myMembership?.role as any) === "ADMIN" ||
      (myMembership?.role as any) === "Admin" ||
      (myMembership?.role as any)?.name === "Admin" ||
      (myMembership?.role as any)?.name === "ADMIN" ||
      (myMembership?.role as any)?.permissions?.includes("manage_members") ||
      (myMembership?.role as any)?.permissions?.includes("manage_finances")
    : false;

  const isEqub =
    !mahber ||
    mahber?.type === "EQUB" ||
    (mahber?.type as string)?.toUpperCase() === "EQUB";

  // Paginated / filtered list
  const {
    data: paymentResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["mahber-payments", id, page, search, typeFilter, sortField, sortOrder],
    queryFn: () =>
      financialService.getMahberPayments(id, {
        page,
        limit,
        search: search || undefined,
        type: typeFilter,
        sort: sortField,
        order: sortOrder,
      }),
  });

  const paymentsList = paymentResponse?.data || [];
  const { total = 0, totalPages = 0 } = paymentResponse?.meta || {};

  // All payments (unpaginated) for stat totals
  const { data: allPaymentsData } = useQuery({
    queryKey: ["mahber-payments-all", id],
    queryFn: () => financialService.getMahberPayments(id, { page: 1, limit: 1000 }),
    staleTime: 30_000,
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["mahber-expenses", id],
    queryFn: () => financialService.getExpenses(id),
  });

  const expensesList = expensesData?.data || [];
  const totalExpenses = expensesList.reduce((acc, e) => acc + Number(e.amount), 0);

  const { data: walletData } = useQuery({
    queryKey: ["mahber-wallet-balance", id],
    queryFn: () => financialService.getWallet(id),
    staleTime: 10_000,
  });

  const currentBalance = Number(walletData?.balance ?? 0);

  const allPayments = allPaymentsData?.data || [];
  const totalContributions =
    allPayments
      .filter((p) => p.status === "Completed" && p.payment_type === "Contribution")
      .reduce((acc, p) => acc + Number(p.amount), 0) || 0;
  const pendingAmount =
    allPayments
      .filter((p) => p.status === "Pending")
      .reduce((acc, p) => acc + Number(p.amount), 0) || 0;

  // ── Sort helpers ──
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      onFilterChange({ sortOrder: sortOrder === "desc" ? "asc" : "desc" });
    } else {
      onFilterChange({ sortField: field, sortOrder: "desc" });
    }
  };

  const sortOptions: { label: string; field: SortField; order: SortOrder }[] = [
    { label: "Newest", field: "date", order: "desc" },
    { label: "Oldest", field: "date", order: "asc" },
    { label: "Highest", field: "amount", order: "desc" },
    { label: "Lowest", field: "amount", order: "asc" },
  ];

  const activeSortLabel =
    sortOptions.find((o) => o.field === sortField && o.order === sortOrder)
      ?.label || "Newest";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              asChild
              variant="outline"
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
            >
              <Link href={`/mahbers/${id}/payments/audit`}>
                <Wallet className="w-4 h-4" />
                {t('financialAudit')}
              </Link>
            </Button>
            )}
          {isEqub && (
            <Button
              asChild
              variant="outline"
              className="gap-2 border-gold/50 text-gold hover:bg-gold/10"
            >
              <Link href={`/mahbers/${id}/lottery`}>
                <Trophy className="w-4 h-4" />
                {t('lotteryDraw')}
              </Link>
            </Button>
            )}
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/mahbers/${id}/wallet`}>
              <Wallet className="w-4 h-4" />
              {t('walletLedger')}
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportCsv}
                isLoading={exporting === 'csv'}
              >
                <Download className="w-4 h-4" />
                {t('exportCSV')}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportPdf}
                isLoading={exporting === 'pdf'}
              >
                <Download className="w-4 h-4" />
                {t('exportPDF')}
              </Button>
            </>
          )}
          {hasOutstanding && !isPaymentInProgress ? (
            <Button asChild className="gap-2">
              <Link href={`/mahbers/${id}/payments/initiate`}>
                <CreditCard className="w-4 h-4" />
                {t('makePayment')}
              </Link>
            </Button>
          ) : isPaymentInProgress ? (
            <Button disabled variant="secondary" className="gap-2">
              {t('paymentInProgress')}
            </Button>
          ) : (
            <Button disabled variant="secondary" className="gap-2">
              {t('allPaidUp')}
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={tab === "payments" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("payments")}
          className="whitespace-nowrap"
        >
          <CreditCard className="w-4 h-4 mr-1.5" />
          {t('payments')}
        </Button>
        <Button
          variant={tab === "expenses" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("expenses")}
          className="whitespace-nowrap"
        >
          <Receipt className="w-4 h-4 mr-1.5" />
          {t('expenses')}
        </Button>
      </div>

      {tab === "expenses" ? (
        <>
          {/* Expenses Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-text-primary">
              Expenses & Debits
            </h2>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-2 border-status-warning/50 text-status-warning hover:bg-status-warning/10"
                  >
                    <Link href={`/mahbers/${id}/expenses/approve`}>
                      <ExternalLink className="w-4 h-4" />
                      Approve Expenses
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="gap-2 bg-gold hover:bg-gold-dark text-black font-medium"
                  >
                    <Link href={`/mahbers/${id}/expenses/create`}>
                      <PlusCircle className="w-4 h-4" />
                      Record Expense
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Expenses List */}
          {expensesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-20 animate-pulse bg-surface-active/50" />
              ))}
            </div>
          ) : expensesList.length === 0 ? (
            <div className="text-center py-16 glass rounded-card">
              <Receipt className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-40" />
              <p className="text-text-secondary text-lg font-medium">
                {t('noExpenses')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expensesList.map((expense) => (
                <Card key={expense.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-xs border-border-glass text-text-secondary"
                          >
                            {expense.category}
                          </Badge>
                          <StatusBadge status={expense.status} />
                        </div>
                      </div>
                      <p className="text-sm text-text-primary mb-4 line-clamp-3">
                        {expense.reason}
                      </p>
                      <div className="mt-auto pt-4 border-t border-border-glass flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-status-error">
                            -{expense.amount.toLocaleString()} ETB
                          </span>
                          <span className="text-xs text-text-muted mt-1">
                            {new Date(expense.created_at).toLocaleDateString()}
                            {expense.creator?.name && ` • ${expense.creator.name}`}
                            {expense.approver?.name && ` • Approved by ${expense.approver.name}`}
                            {expense.status === "Pending" && " • Awaiting approval"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-text-primary mb-4 line-clamp-3">
                        {expense.reason}
                      </p>
                      <div className="mt-auto pt-4 border-t border-border-glass flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-status-error">
                            -{expense.amount.toLocaleString()} ETB
                          </span>
                          <span className="text-xs text-text-muted mt-1">
                            {new Date(expense.created_at).toLocaleDateString()}
                            {expense.creator?.name && t('expenseBy', { name: expense.creator.name })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-2">
        <Card className="bg-gradient-to-br from-gold/20 to-background-dark border-gold/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('totalContributions')}
            </CardTitle>
            <Wallet className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">
              {totalContributions.toLocaleString()} ETB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('pendingPayments')}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-text-primary">
              {pendingAmount.toLocaleString()} ETB
            </div>
            <p className="text-xs text-text-muted mt-1">
              {t('pendingIncludes')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('totalExpenses')}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-status-error" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-error">
              {totalExpenses.toLocaleString()} ETB
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-status-success/20 to-background-dark border-status-success/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('currentBalance')}
            </CardTitle>
            <Wallet className="h-4 w-4 text-status-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-success">
              {currentBalance.toLocaleString()} ETB
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasOutstanding && !isLoading && (
        <Card className="border-border-glass bg-background/60">
          <CardContent className="p-4 text-text-secondary">
            {t('noOutstanding')}
          </CardContent>
        </Card>
      )}

      {/* Search, Filter, Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
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
          {/* Type filter */}
          <div className="flex items-center gap-1 bg-background-dark/50 border border-border-glass rounded-input px-1 py-1">
            {(["All", "Contribution", "Fine", "JoinFee"] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => onFilterChange({ type: filterType })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  typeFilter === filterType
                    ? "bg-gold text-black"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {filterType === "JoinFee" ? t('joinFee') : t(filterType.toLowerCase())}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-background-dark/50 border border-border-glass rounded-input text-sm text-text-secondary hover:text-text-primary transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{activeSortLabel}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface-card border border-border-glass rounded-card shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
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

      {/* Payment List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-20 animate-pulse bg-surface-active/50" />
            ))}
          </div>
        ) : paymentsList.length === 0 ? (
          <div className="text-center py-16 glass rounded-card">
            <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-40" />
              <p className="text-text-secondary text-lg font-medium">
                {search || typeFilter !== "All"
                  ? t('noPaymentsMatch')
                  : t('noPaymentHistory')}
              </p>
              {(search || typeFilter !== "All") && (
                <Button
                  variant="ghost"
                  className="mt-3 text-sm"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setTypeFilter("All");
                    setPage(1);
                  }}
                >
                  {t('clearFilters')}
                </Button>
              )}
          </div>
        ) : (
          <>
            {paymentsList.map((payment) => (
              <Card
                key={payment.id}
                className="hover:bg-surface-hover/50 transition-colors"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {payment.payment_type.charAt(0) +
                          payment.payment_type.slice(1).toLowerCase()}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {new Date(payment.created_at).toLocaleDateString()} • {t('ref', { ref: payment.tx_ref.slice(0, 8) })}
                        {payment.user?.name && t('expenseBy', { name: payment.user.name })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-bold">
                      {payment.amount.toLocaleString()} ETB
                    </span>
                    <Badge
                      variant={
                        payment.status === "Completed"
                          ? "success"
                          : payment.status === "Pending"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {payment.status}
                    </Badge>
                    {payment.status === "Completed" && (
                      <button
                        onClick={() => downloadReceipt(payment.id)}
                        className="p-2 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-colors"
                        title={t('downloadReceipt')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 pb-2">
                <p className="text-sm text-text-muted">
                  {t('pageInfo', { page, totalPages, total })}
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
          </>
        )}
      </div>
      </>
    )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, { variant: "warning" | "success" | "destructive" | "outline"; label: string }> = {
    Pending: { variant: "warning", label: "Pending" },
    Rejected: { variant: "destructive", label: "Rejected" },
    Paid: { variant: "success", label: "Paid" },
    Failed: { variant: "destructive", label: "Failed" },
  };

  const config = variantMap[status] || { variant: "outline" as const, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
