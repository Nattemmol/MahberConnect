"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Wallet,
  Calendar,
  Shield,
  AlertCircle,
  Clock,
  Ban,
  UserCheck,
  Infinity,
} from "lucide-react";
import { memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SuspendMemberParams } from "@/lib/types";
import toast from "react-hot-toast";

const SUSPEND_DURATION_PRESETS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id, memberId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState<number | null>(7);
  const [suspendReason, setSuspendReason] = useState("");
  const [isPermanentSuspension, setIsPermanentSuspension] = useState(false);
  const [customDuration, setCustomDuration] = useState("");

  const { data: member, isLoading } = useQuery({
    queryKey: ["mahber-member", id, memberId],
    queryFn: () => memberService.getMemberById(id, memberId),
  });

  const suspendMutation = useMutation({
    mutationFn: (params?: SuspendMemberParams) =>
      memberService.suspendMember(id, memberId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-member", id, memberId] });
      queryClient.invalidateQueries({ queryKey: ["mahber-members", id] });
      toast.success("Member suspended successfully");
      setIsSuspendDialogOpen(false);
      resetSuspendState();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to suspend member";
      toast.error(msg);
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: () => memberService.reinstateMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-member", id, memberId] });
      queryClient.invalidateQueries({ queryKey: ["mahber-members", id] });
      toast.success("Member reinstated successfully");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to reinstate member";
      toast.error(msg);
    },
  });

  const unbanMutation = useMutation({
    mutationFn: () => memberService.unbanMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-member", id, memberId] });
      queryClient.invalidateQueries({ queryKey: ["mahber-members", id] });
      toast.success("Member unbanned successfully");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to unban member";
      toast.error(msg);
    },
  });

  const resetSuspendState = () => {
    setSuspendDuration(7);
    setSuspendReason("");
    setIsPermanentSuspension(false);
    setCustomDuration("");
  };

  const openSuspendDialog = (permanent = false) => {
    resetSuspendState();
    if (permanent) {
      setSuspendDuration(null);
      setIsPermanentSuspension(true);
      setSuspendReason("Banned from Suspended state");
    }
    setIsSuspendDialogOpen(true);
  };

  const getRemaining = () => {
    if (!member?.suspended_until) return null;
    const remaining = new Date(member.suspended_until).getTime() - Date.now();
    if (remaining <= 0) return "Expiring...";
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    return `${days}d ${hours}h remaining`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-32" />
          <Card className="h-32" />
        </div>
      </div>
    );
  }

  if (!member) return <div>Member not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Members
      </Button>

      <PageHeader
        title={member.user?.name || "Member Detail"}
        description={member.user?.phone || ""}
      >
        <div className="flex gap-2">
          {member.status === "Active" && (
            <Button
              variant="destructive"
              onClick={() => openSuspendDialog(false)}
            >
              Suspend Member
            </Button>
          )}
          {member.status === "Suspended" && (
            <>
              <Button
                variant="default"
                onClick={() => reinstateMutation.mutate()}
                isLoading={reinstateMutation.isPending}
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                Reinstate Now
              </Button>
              <Button
                variant="destructive"
                onClick={() => openSuspendDialog(true)}
                isLoading={suspendMutation.isPending}
              >
                <Ban className="w-4 h-4 mr-1.5" />
                Ban Instead
              </Button>
            </>
          )}
          {member.status === "Banned" && (
            <Button
              variant="outline"
              onClick={() => unbanMutation.mutate()}
              isLoading={unbanMutation.isPending}
              className="border-gold/50 text-gold hover:bg-gold/10"
            >
              <UserCheck className="w-4 h-4 mr-1.5" />
              Unban
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <UserIcon className="w-12 h-12" />
            </Avatar>
            <h3 className="text-xl font-bold">{member.user?.name}</h3>
            <p className="text-text-secondary text-sm mb-4">
              {member.user?.phone}
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">{member.role_name || member.role}</Badge>
              <Badge
                variant={
                  member.status === "Active"
                    ? "success"
                    : member.status === "Suspended" || member.status === "Banned"
                      ? "destructive"
                      : "warning"
                }
              >
                {member.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {member.status === "Suspended" && (
            <Card className="border-status-error/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-status-error flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Suspension Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {member.suspension_reason && (
                  <div>
                    <p className="text-xs text-text-muted">Reason</p>
                    <p className="text-sm">{member.suspension_reason}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-text-muted">Status</p>
                  <p className="text-sm">
                    {member.suspended_until
                      ? `Temporary — ${getRemaining()}`
                      : "Permanent"}
                  </p>
                </div>
                {member.suspended_until && (
                  <div>
                    <p className="text-xs text-text-muted">Auto-reinstatement</p>
                    <p className="text-sm">
                      {new Date(member.suspended_until).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {parseFloat(member.balance).toLocaleString()} ETB
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Join Date
                </CardTitle>
                <Calendar className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {new Date(member.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Equb Status
                </CardTitle>
                <Shield className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <Badge
                  variant={member.has_won_current_cycle ? "success" : "outline"}
                >
                  {member.has_won_current_cycle ? "Already Won" : "Eligible"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  Last Action
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-text-secondary">
                  Updated: {new Date(member.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Suspend Dialog */}
      <Dialog
        isOpen={isSuspendDialogOpen}
        onClose={() => {
          setIsSuspendDialogOpen(false);
          resetSuspendState();
        }}
        title={`Suspend ${member.user?.name}`}
        description="Set a duration and reason for the suspension."
      >
        <div className="space-y-5 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary mb-2">Duration</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {SUSPEND_DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => {
                    setSuspendDuration(preset.days);
                    setIsPermanentSuspension(false);
                    setCustomDuration("");
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    !isPermanentSuspension && suspendDuration === preset.days && customDuration === ""
                      ? "border-gold bg-gold/20 text-gold"
                      : "border-border-glass text-text-secondary hover:border-gold/50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                placeholder="Custom days"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  setIsPermanentSuspension(false);
                  if (e.target.value) setSuspendDuration(null);
                }}
                disabled={isPermanentSuspension}
                className="w-32"
              />
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPermanentSuspension}
                  onChange={(e) => {
                    setIsPermanentSuspension(e.target.checked);
                    if (e.target.checked) {
                      setSuspendDuration(null);
                      setCustomDuration("");
                    }
                  }}
                  className="rounded border-border-glass"
                />
                <Infinity className="w-4 h-4" />
                Permanent
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-text-primary mb-2">Reason (optional)</p>
            <textarea
              placeholder="e.g. Missed 3 consecutive payments"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              className="w-full rounded-input border border-border-glass bg-background-dark/50 px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSuspendDialogOpen(false);
                resetSuspendState();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const finalDuration = isPermanentSuspension
                  ? undefined
                  : customDuration
                    ? parseInt(customDuration, 10)
                    : suspendDuration ?? undefined;
                if (!isPermanentSuspension && finalDuration !== undefined && finalDuration < 1) {
                  toast.error("Duration must be at least 1 day");
                  return;
                }
                suspendMutation.mutate({
                  duration_days: finalDuration,
                  reason: suspendReason.trim() || undefined,
                });
              }}
              isLoading={suspendMutation.isPending}
              className="bg-gold hover:bg-gold-dark text-black font-semibold"
            >
              Confirm Suspension
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
