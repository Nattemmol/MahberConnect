"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState, useCallback } from "react";
import {
  Check,
  X,
  User as UserIcon,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import { memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import type { BatchProcessItem } from "@/lib/types";

export default function JoinRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("JoinRequests");
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchRejectDialog, setShowBatchRejectDialog] = useState(false);
  const [batchRejectionReason, setBatchRejectionReason] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["mahber-join-requests", id],
    queryFn: () => memberService.getJoinRequests(id),
  });

  const pendingRequests =
    requests?.filter((r) => String(r.status).toLowerCase() === "pending") || [];

  const allSelected =
    pendingRequests.length > 0 && selectedIds.size === pendingRequests.length;

  const toggleSelect = useCallback((requestId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
    }
  }, [allSelected, pendingRequests]);

  const handleActionMutation = useMutation({
    mutationFn: ({
      requestId,
      action,
      reason,
    }: {
      requestId: string;
      action: "approve" | "reject";
      reason?: string;
    }) =>
      memberService.handleJoinRequest(id, requestId, {
        action,
        rejection_reason: reason,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mahber-join-requests", id] });
      toast.success(
        variables.action === "approve" ? t('requestApproved') : t('requestRejected'),
      );
      setRejectId(null);
      setRejectionReason("");
    },
    onError: () => toast.error(t('processFailed')),
  });

  const batchMutation = useMutation({
    mutationFn: (items: BatchProcessItem[]) =>
      memberService.batchHandleJoinRequests(id, items),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["mahber-join-requests", id] });
      setSelectedIds(new Set());
      setShowBatchRejectDialog(false);
      setBatchRejectionReason("");

      const parts: string[] = [];
      if (result.approved > 0) parts.push(`${result.approved} ${t('approved')}`);
      if (result.rejected > 0) parts.push(`${result.rejected} ${t('rejected')}`);
      if (result.failed.length > 0)
        parts.push(`${result.failed.length} ${t('failed')}`);

      toast.success(t('batchComplete', { summary: parts.join(", ") }));
      if (result.failed.length > 0) {
        result.failed.forEach((f) =>
          toast.error(`${f.requestId.slice(0, 8)}…: ${f.reason}`, {
            id: f.requestId,
          }),
        );
      }
    },
    onError: () => toast.error(t('batchFailed')),
  });

  const handleBatchApprove = () => {
    const items: BatchProcessItem[] = Array.from(selectedIds).map(
      (requestId) => ({ requestId, action: "approve" as const }),
    );
    batchMutation.mutate(items);
  };

  const handleBatchReject = () => {
    const items: BatchProcessItem[] = Array.from(selectedIds).map(
      (requestId) => ({
        requestId,
        action: "reject" as const,
        rejection_reason: batchRejectionReason || undefined,
      }),
    );
    batchMutation.mutate(items);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-center py-12 glass rounded-card">
          <p className="text-text-secondary">{t('noPendingRequests')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Batch Action Bar */}
          {selectedIds.size > 0 && (
            <Card className="bg-gold/5 border-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {t('selectedCount', { count: selectedIds.size })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="text-status-error hover:bg-status-error/10 border-border-glass"
                      onClick={() => setShowBatchRejectDialog(true)}
                      isLoading={batchMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('rejectSelected')}
                    </Button>
                    <Button
                      onClick={handleBatchApprove}
                      isLoading={batchMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t('approveSelected')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {pendingRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleSelect(request.id)}
                      className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
                      aria-label={
                        selectedIds.has(request.id)
                          ? t('deselect')
                          : t('select')
                      }
                    >
                      {selectedIds.has(request.id) ? (
                        <CheckSquare className="w-5 h-5 text-gold" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <Avatar className="w-12 h-12">
                      <UserIcon className="w-6 h-6" />
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-text-primary">
                        {request.user?.name}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        {request.user?.phone}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                        {request.invitation_code && (
                          <Badge
                            variant="outline"
                            className="ml-2 py-0 h-4 text-[10px]"
                          >
                            {t('code', { code: request.invitation_code })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="text-status-error hover:bg-status-error/10 border-border-glass"
                      onClick={() => setRejectId(request.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('reject')}
                    </Button>
                    <Button
                      onClick={() =>
                        handleActionMutation.mutate({
                          requestId: request.id,
                          action: "approve",
                        })
                      }
                      isLoading={
                        handleActionMutation.isPending &&
                        handleActionMutation.variables?.requestId === request.id
                      }
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t('approve')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Individual Rejection Modal */}
      <Dialog
        isOpen={!!rejectId}
        onClose={() => setRejectId(null)}
        title={t('rejectTitle')}
        description={t('rejectDesc')}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              {t('rejectionReason')}
            </label>
            <Input
              placeholder={t('rejectionPlaceholder')}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setRejectId(null)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={() =>
                rejectId &&
                handleActionMutation.mutate({
                  requestId: rejectId,
                  action: "reject",
                  reason: rejectionReason,
                })
              }
              isLoading={handleActionMutation.isPending}
            >
              {t('confirmRejection')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Batch Reject Modal */}
      <Dialog
        isOpen={showBatchRejectDialog}
        onClose={() => setShowBatchRejectDialog(false)}
        title={t('rejectSelectedTitle')}
        description={t('rejectSelectedDesc', { count: selectedIds.size })}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              {t('batchRejectionReason')}
            </label>
            <Input
              placeholder={t('batchRejectionPlaceholder')}
              value={batchRejectionReason}
              onChange={(e) => setBatchRejectionReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowBatchRejectDialog(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchReject}
              isLoading={batchMutation.isPending}
            >
              {t('rejectCountRequests', { count: selectedIds.size })}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
