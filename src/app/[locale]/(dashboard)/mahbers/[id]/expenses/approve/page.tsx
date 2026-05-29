"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Receipt,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import { financialService, memberService } from "@/lib/api/service-factory";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Expense } from "@/lib/types";

export default function ApproveExpensesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [rejectModal, setRejectModal] = useState<{ open: boolean; expense: Expense | null }>({
    open: false,
    expense: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [approveModal, setApproveModal] = useState<{ open: boolean; expense: Expense | null }>({
    open: false,
    expense: null,
  });

  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
  });

  const myMembership = membersResponse?.data?.find(
    (m) => m.user?.id === user?.id,
  );

  const canApprove = membersResponse
    ? (myMembership?.role as any)?.permissions?.includes("approve_expense") ??
      myMembership?.permissions?.includes("approve_expense")
    : false;

  console.log("[ApproveExpenses] membership data:", {
    myMembershipId: myMembership?.id,
    role: myMembership?.role,
    role_name: myMembership?.role_name,
    permissions: myMembership?.permissions,
    rolePermissions: (myMembership?.role as any)?.permissions,
    canApprove,
  });

  const { data: pendingData, isLoading } = useQuery({
    queryKey: ["pending-expenses", id],
    queryFn: () => financialService.getPendingExpenses(id),
    enabled: canApprove,
  });

  const pendingExpenses = pendingData?.data || [];

  const approveMutation = useMutation({
    mutationFn: (expenseId: string) =>
      financialService.approveExpense(id, expenseId),
    onSuccess: (data: Expense) => {
      toast.success(
        `Expense approved! Chapa ref: ${data.chapa_transfer_ref || "N/A"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["pending-expenses", id] });
      queryClient.invalidateQueries({ queryKey: ["mahber-expenses", id] });
      queryClient.invalidateQueries({ queryKey: ["mahber-wallet-balance", id] });
      setApproveModal({ open: false, expense: null });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to approve expense";
      toast.error(msg);
      setApproveModal({ open: false, expense: null });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      expenseId,
      reason,
    }: {
      expenseId: string;
      reason: string;
    }) => financialService.rejectExpense(id, expenseId, reason),
    onSuccess: () => {
      toast.success("Expense rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-expenses", id] });
      setRejectModal({ open: false, expense: null });
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reject expense");
    },
  });

  const handleApprove = (expense: Expense) => {
    setApproveModal({ open: true, expense });
  };

  const confirmApprove = () => {
    if (approveModal.expense) {
      approveMutation.mutate(approveModal.expense.id);
    }
  };

  const handleReject = (expense: Expense) => {
    setRejectModal({ open: true, expense });
  };

  const confirmReject = () => {
    if (rejectModal.expense && rejectReason.trim()) {
      rejectMutation.mutate({
        expenseId: rejectModal.expense.id,
        reason: rejectReason.trim(),
      });
    }
  };

  if (!canApprove) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Approve Expenses"
          description="Review and approve expense requests."
        />
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-text-secondary text-lg">
              You do not have permission to approve expenses. Only admins can approve expenses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Approve Expenses"
        description="Review pending expense requests and approve or reject them."
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-surface-active/50" />
          ))}
        </div>
      ) : pendingExpenses.length === 0 ? (
        <div className="text-center py-16 glass rounded-card">
          <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-4" />
          <p className="text-text-secondary text-lg font-medium">
            No pending expenses to review.
          </p>
          <p className="text-text-muted text-sm mt-1">
            All expenses have been processed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingExpenses.map((expense) => (
            <Card key={expense.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-xs border-status-warning text-status-warning"
                      >
                        Pending
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs border-border-glass text-text-secondary"
                      >
                        {expense.category}
                      </Badge>
                    </div>
                    <span className="text-2xl font-bold text-status-error">
                      -{expense.amount.toLocaleString()} ETB
                    </span>
                  </div>

                  <p className="text-text-primary mb-4">{expense.reason}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-border-glass pt-4 mb-4">
                    <div>
                      <span className="text-text-muted block text-xs">
                        Submitted by
                      </span>
                      <span className="text-text-primary flex items-center gap-1 mt-0.5">
                        <UserIcon className="w-3.5 h-3.5 text-text-muted" />
                        {expense.creator?.name || expense.created_by}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-xs">Date</span>
                      <span className="text-text-primary mt-0.5 block">
                        {new Date(expense.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-text-muted block text-xs">
                        Recipient
                      </span>
                      <span className="text-text-primary mt-0.5 block">
                        {expense.recipient_name} ({expense.recipient_account_type}) — {expense.recipient_account}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-border-glass">
                    <Button
                      onClick={() => handleApprove(expense)}
                      className="flex-1 gap-2 bg-status-success hover:bg-status-success/90 text-white"
                      isLoading={approveMutation.isPending && approveModal.expense?.id === expense.id}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Pay
                    </Button>
                    <Button
                      onClick={() => handleReject(expense)}
                      variant="outline"
                      className="flex-1 gap-2 border-status-error text-status-error hover:bg-status-error/10"
                      isLoading={rejectMutation.isPending && rejectModal.expense?.id === expense.id}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModal.open && approveModal.expense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Confirm Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-text-secondary">
                This will send{" "}
                <strong>{approveModal.expense.amount.toLocaleString()} ETB</strong>{" "}
                via Chapa to {approveModal.expense.recipient_name}.
              </p>
              <div className="bg-surface-active/50 rounded-card p-3 text-sm space-y-1">
                <p>
                  <span className="text-text-muted">Recipient:</span>{" "}
                  {approveModal.expense.recipient_name}
                </p>
                <p>
                  <span className="text-text-muted">Account:</span>{" "}
                  {approveModal.expense.recipient_account}
                </p>
                <p>
                  <span className="text-text-muted">Reason:</span>{" "}
                  {approveModal.expense.reason}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setApproveModal({ open: false, expense: null })}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-status-success hover:bg-status-success/90 text-white"
                  onClick={confirmApprove}
                  isLoading={approveMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && rejectModal.expense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Reject Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors resize-none"
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRejectModal({ open: false, expense: null });
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-status-error hover:bg-status-error/90 text-white"
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  isLoading={rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
