"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Camera,
  CheckCircle,
  CheckSquare,
  AlertCircle,
  Users,
  Pencil,
  XCircle,
  History,
  ScanLine,
  List,
  Zap,
  Mail,
  XSquare,
  Repeat,
} from "lucide-react";
import { QRScanner } from "@/components/ui/qr-scanner";
import { useAuthStore } from "@/lib/stores/auth-store";
import Link from "next/link";
import { eventService, memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCode } from "@/components/ui/qrcode";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { use, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { canManageEvents } from "@/lib/utils";
import type { EventInvitation } from "@/lib/types";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showUserQR, setShowUserQR] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();
  const t = useTranslations("EventDetail");

  const { data: currentMember } = useQuery({
    queryKey: ["mahber-member", id, user?.id],
    queryFn: () => memberService.getMemberById(id, user?.id || ""),
    enabled: !!user?.id,
  });
  const canManageEventsValue = canManageEvents(currentMember);

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ["mahber-event", id, eventId],
    queryFn: () => eventService.getEventById(id, eventId),
  });

  const isEventHost = user?.id ? user.id === event?.host_id : false;

  const { data: members } = useQuery({
    queryKey: ["mahber-members", id],
    queryFn: () => memberService.getMembers(id),
    enabled: canManageEventsValue || isEventHost,
  });

  const { data: invitations, refetch: refetchInvitations } = useQuery({
    queryKey: ["event-invitations", id, eventId],
    queryFn: () => eventService.getInvitations(id, eventId),
    enabled: (canManageEventsValue || isEventHost) && !!event,
  });

  const { data: myInvitations, refetch: refetchMyInvitations } = useQuery({
    queryKey: ["my-event-invitations", id, eventId, user?.id],
    queryFn: async () => {
      const all = await eventService.getMyInvitations(id);
      return all.filter((inv) => inv.event_id === eventId);
    },
    enabled: !!user?.id && !!event && !canManageEventsValue,
  });

  const myRegistration = useMemo(() => {
    if (!myInvitations) return null;
    const accepted = myInvitations.find((inv) => inv.status === "Accepted");
    const pending = myInvitations.find((inv) => inv.status === "Pending");
    const declined = myInvitations.find((inv) => inv.status === "Declined");
    if (accepted) return { status: "registered" as const, invitation: accepted };
    if (pending) return { status: "invited" as const, invitation: pending };
    if (declined) return { status: "declined" as const, invitation: declined };
    return null;
  }, [myInvitations]);

  const invitationSummary = useMemo(() => {
    if (!invitations) return null;
    const total = invitations.length;
    const accepted = invitations.filter((i) => i.status === "Accepted").length;
    const declined = invitations.filter((i) => i.status === "Declined").length;
    const pending = invitations.filter((i) => i.status === "Pending").length;
    return { total, accepted, declined, pending };
  }, [invitations]);

  const activeMembers = useMemo(() => {
    if (!members?.data) return [];
    return members.data.filter(
      (m: any) => m.status === "Active" || m.status === "Active",
    );
  }, [members]);

  const filteredActiveMembers = useMemo(() => {
    if (!searchQuery) return activeMembers;
    const q = searchQuery.toLowerCase();
    return activeMembers.filter(
      (m: any) =>
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.phone?.includes(q),
    );
  }, [activeMembers, searchQuery]);

  const { data: userQRCode, isLoading: isUserQRLoading } = useQuery({
    queryKey: ["user-event-qr", id, eventId, user?.id],
    queryFn: () => eventService.getUserQRCode(id, eventId),
    enabled: showUserQR && !!user?.id && !canManageEventsValue,
  });

  const { data: attendanceResponse, isError: isAttendanceError } = useQuery({
    queryKey: ["event-attendance", id, eventId],
    queryFn: () => eventService.getAttendance(id, eventId),
  });

  const totalAttendees = attendanceResponse?.data?.length || 0;

  const downloadQRCode = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getErrorMessage = (error: unknown) => {
    if (!error || typeof error !== "object") return undefined;
    if ("response" in error) {
      return (error as { response?: { data?: { message?: string } } }).response
        ?.data?.message;
    }
    return undefined;
  };

  const checkInMutation = useMutation({
    mutationFn: (token: string) => eventService.checkIn(id, eventId, token),
    onSuccess: () => {
      toast.success(t('checkinSuccess'));
      setShowScanner(false);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('checkinFailed'));
      setShowScanner(false);
    },
  });

  const manualCheckInMutation = useMutation({
    mutationFn: (memberId: string) =>
      eventService.manualCheckIn(id, eventId, memberId),
    onSuccess: () => {
      toast.success(t('manualCheckinSuccess'));
      queryClient.invalidateQueries({
        queryKey: ["event-attendance", id, eventId],
      });
      setShowManualDialog(false);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('manualCheckinFailed'));
    },
  });

  const handleQRScanned = (token: string) => {
    checkInMutation.mutate(token);
  };

  const cancelMutation = useMutation({
    mutationFn: () => eventService.cancelEvent(id, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-events", id] });
      queryClient.invalidateQueries({
        queryKey: ["mahber-event", id, eventId],
      });
      toast.success(t('eventCancelled'));
      setShowCancelDialog(false);
    },
    onError: () => toast.error(t('cancelFailed')),
  });

  const processAttendanceMutation = useMutation({
    mutationFn: () => eventService.processAttendance(id, eventId),
    onSuccess: (data) => {
      toast.success(data.message || t('attendanceProcessing'));
      setShowProcessDialog(false);
    },
    onError: () => toast.error(t('attendanceProcessFailed')),
  });

  const sendInvitationsMutation = useMutation({
    mutationFn: (memberIds: string[]) =>
      eventService.sendInvitations(id, eventId, memberIds),
    onSuccess: (data) => {
      toast.success(
        t('invitationsSent', { invited: data.invited, alreadyInvited: data.already_invited }),
      );
      setShowInviteDialog(false);
      setSelectedMemberIds([]);
      refetchInvitations();
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('inviteFailed'));
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => eventService.registerForEvent(id, eventId),
    onSuccess: () => {
      toast.success(t('registrationSuccess'));
      refetchMyInvitations();
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('registrationFailed'));
    },
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: () => eventService.cancelRegistration(id, eventId),
    onSuccess: () => {
      toast.success(t('registrationCancelled'));
      refetchMyInvitations();
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('cancelRegFailed'));
    },
  });

  const respondInvitationMutation = useMutation({
    mutationFn: ({
      invitationId,
      action,
    }: {
      invitationId: string;
      action: "accept" | "decline";
    }) => eventService.respondToInvitation(id, eventId, invitationId, action),
    onSuccess: () => {
      toast.success(t('responseRecorded'));
      refetchMyInvitations();
      queryClient.invalidateQueries({
        queryKey: ["event-invitations", id, eventId],
      });
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('responseFailed'));
    },
  });

  const handleSendInvitations = () => {
    if (selectedMemberIds.length === 0) {
      toast.error(t('selectAtLeastOne'));
      return;
    }
    sendInvitationsMutation.mutate(selectedMemberIds);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  if (isEventLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card className="h-48" />
        <Card className="h-64" />
      </div>
    );
  }

  if (!event) return <div>{t('eventNotFound')}</div>;

  const now = new Date();
  const isPastEvent = new Date(event.start_time) <= now;
  const isEventOngoing = now >= new Date(event.start_time) && now <= new Date(event.end_time);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        {t('backToEvents')}
      </Button>

      <PageHeader title={event.title} description={event.description}>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/mahbers/${id}/events/${eventId}/attendance`}>
              <List className="w-4 h-4" />
              {t('attendance')}
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/mahbers/${id}/events/${eventId}/photos`}>
              <Camera className="w-4 h-4" />
              {t('photoGallery')}
            </Link>
          </Button>
          {canManageEventsValue && !event.is_cancelled && (
            <>
              <Button variant="outline" asChild className="gap-2">
                <Link href={`/mahbers/${id}/events/${eventId}/edit`}>
                  <Pencil className="w-4 h-4" />
                  {t('edit')}
                </Link>
              </Button>
              {!isPastEvent && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="gap-2 text-status-warning border-status-warning/30 hover:bg-status-warning/10"
                >
                  <XCircle className="w-4 h-4" />
                  {t('cancelEvent')}
                </Button>
              )}
            </>
          )}
          {/* Host / Admin: Send Invitations */}
          {(canManageEventsValue || isEventHost) && !event.is_cancelled && !isPastEvent && (
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(true)}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              {t('sendInvitations')}
            </Button>
          )}
          {/* Admin: Process Attendance */}
          {canManageEventsValue &&
            isPastEvent &&
            event.is_mandatory &&
            !event.is_cancelled && (
              <Button
                variant="outline"
                onClick={() => setShowProcessDialog(true)}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                {t('processAttendance')}
              </Button>
            )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('eventDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="text-gold border-gold/30 bg-gold/5"
              >
                {event.event_type.replace(/_/g, " ")}
              </Badge>
              {event.is_mandatory && (
                <Badge variant="destructive">Mandatory</Badge>
              )}
              {event.is_cancelled && (
                <Badge variant="secondary">Cancelled</Badge>
              )}
              {isPastEvent && !event.is_cancelled && (
                <Badge variant="success">Completed</Badge>
              )}
              {event.host_user && (
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                  {t('host', { name: event.host_user.name })}
                </Badge>
              )}
              {(event.recurrence_pattern && event.recurrence_pattern !== "None" || event.series_id) && (
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  Repeats: {event.recurrence_pattern || "Yes"}
                  {event.recurrence_end_date && ` until ${new Date(event.recurrence_end_date).toLocaleDateString()}`}
                </Badge>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border-glass">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{t('date')}</h4>
                  <p className="text-text-secondary">
                    {new Date(event.start_time).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{t('time')}</h4>
                  <p className="text-text-secondary">
                    {new Date(event.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(event.end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{t('location')}</h4>
                  <p className="text-text-secondary">{event.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                {t('memberCheckin')}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-status-success" />
            </CardHeader>
            <CardContent>
              {!isPastEvent && !event.is_cancelled ? (
                <div className="space-y-4">
                  {!canManageEventsValue && !isEventHost ? (
                    <>
                      {/* RSVP / Registration */}
                      {myRegistration?.status === "registered" ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-status-success text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {t('youAreRegistered')}
                          </div>
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => cancelRegistrationMutation.mutate()}
                            isLoading={cancelRegistrationMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                            {t('cancelRegistration')}
                          </Button>
                        </div>
                      ) : myRegistration?.status === "invited" ? (
                        <div className="space-y-3">
                          <p className="text-sm text-text-muted">
                            {t('youHaveBeenInvited')}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 gap-1"
                              size="sm"
                              onClick={() => {
                                const inv = myRegistration.invitation;
                                eventService.respondToInvitation(id, eventId, inv.id, "accept")
                                  .then(() => { toast.success(t('invitationAccepted')); refetchMyInvitations(); })
                                  .catch((e) => toast.error(getErrorMessage(e) ?? t('responseFailed')));
                              }}
                            >
                              <CheckSquare className="w-3 h-3" />
                              {t('accept')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => {
                                const inv = myRegistration.invitation;
                                eventService.respondToInvitation(id, eventId, inv.id, "decline")
                                  .then(() => { toast.success(t('invitationDeclined')); refetchMyInvitations(); })
                                  .catch((e) => toast.error(getErrorMessage(e) ?? t('responseFailed')));
                              }}
                            >
                              <XSquare className="w-3 h-3" />
                              {t('decline')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-text-muted">
                            {t('registerToAttend')}
                          </p>
                          <Button
                            className="w-full gap-2"
                            onClick={() => registerMutation.mutate()}
                            isLoading={registerMutation.isPending}
                          >
                            <CheckSquare className="w-4 h-4" />
                            {t('registerForEvent')}
                          </Button>
                        </div>
                      )}
                      <hr className="border-border-glass" />
                      <p className="text-sm text-text-muted">
                        {t('generateQR')}
                      </p>
                      <Button
                        className="w-full gap-2 bg-gold hover:bg-gold/90"
                        onClick={() => setShowUserQR(true)}
                      >
                        <Zap className="w-4 h-4" />
                        {t('myCheckinQR')}
                      </Button>
                    </>
                  ) : isEventOngoing ? (
                    <>
                      <p className="text-sm text-text-muted">
                        Scan member QR codes or use manual check-in below.
                      </p>
                      <div className="flex gap-2 flex-col">
                        <Button
                          className="gap-2"
                          onClick={() => setShowScanner(true)}
                        >
                          <Camera className="w-4 h-4" />
                          {t('scanMemberQR')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowManualDialog(true)}
                          disabled={checkInMutation.isPending}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {t('manualCheckin')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-text-muted">
                      {t('checkinOpens')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-status-warning" />
                  <span className="text-text-muted">
                    {isPastEvent ? t('checkinClosed') : t('checkinOpens')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invitations Card — Admin / Host */}
          {(canManageEventsValue || isEventHost) && invitationSummary && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  {t('invitations')}
                </CardTitle>
                <Mail className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{t('sent')}</span>
                    <span className="font-semibold">{invitationSummary.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-status-success">{t('accepted')}</span>
                    <span className="font-semibold">{invitationSummary.accepted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-status-error">{t('declined')}</span>
                    <span className="font-semibold">{invitationSummary.declined}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-status-warning">{t('pending')}</span>
                    <span className="font-semibold">{invitationSummary.pending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-gold/10 to-background-dark">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                {t('checkedIn')}
              </CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {isEventLoading || isAttendanceError ? "--" : totalAttendees}
              </div>
              {isAttendanceError && (
                <p className="text-xs text-status-warning mt-1">
                  {t('attendanceUnavailable')}
                </p>
              )}
              {isPastEvent && !isAttendanceError && (
                <Button
                  variant="link"
                  asChild
                  className="mt-2 p-0 h-auto text-gold text-xs"
                >
                  <Link href={`/mahbers/${id}/events/${eventId}/attendance`}>
                    <List className="w-3 h-3 mr-1" />
                    {t('viewList')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Event Confirmation Dialog */}
      <Dialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title={t('cancelTitle')}
        description={t('cancelDesc')}
      >
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-text-secondary">
            {t('cancelWarning')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCancelDialog(false)}>
              {t('keepEvent')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              isLoading={cancelMutation.isPending}
            >
              {t('cancelEventBtn')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Process Attendance Confirmation Dialog */}
      <Dialog
        isOpen={showProcessDialog}
        onClose={() => setShowProcessDialog(false)}
        title={t('processTitle')}
        description={t('processDesc')}
      >
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-text-secondary">
            {t('processWarning')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => processAttendanceMutation.mutate()}
              isLoading={processAttendanceMutation.isPending}
            >
              {t('processFines')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Send Invitations Dialog */}
      <Dialog
        isOpen={showInviteDialog}
        onClose={() => {
          setShowInviteDialog(false);
          setSelectedMemberIds([]);
        }}
        title={t('sendInvitesTitle')}
        description={t('sendInvitesDesc')}
      >
        <div className="flex flex-col gap-4 py-4 max-h-80 overflow-y-auto">
          {activeMembers.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">
              {t('noActiveMembers')}
            </p>
          ) : (
            activeMembers.map((member: any) => (
              <label
                key={member.member_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-active cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => toggleMember(member.member_id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedMemberIds.includes(member.member_id)
                      ? "bg-gold border-gold text-white"
                      : "border-border-glass hover:border-gold/50"
                  }`}
                >
                  {selectedMemberIds.includes(member.member_id) && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {member.user?.name ?? t('unknownMember')}
                  </p>
                  <p className="text-xs text-text-muted">
                    {member.user?.phone ?? ""}
                  </p>
                </div>
                {member.role_name && (
                  <Badge variant="outline" className="text-xs">
                    {member.role_name}
                  </Badge>
                )}
              </label>
            ))
          )}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border-glass">
          <p className="text-xs text-text-muted">
            {t('selectedCount', { count: selectedMemberIds.length })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowInviteDialog(false);
                setSelectedMemberIds([]);
              }}
            >
              {t('keepEvent')}
            </Button>
            <Button
              onClick={handleSendInvitations}
              isLoading={sendInvitationsMutation.isPending}
              disabled={selectedMemberIds.length === 0}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              {t('send')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* QR Scanner Modal for Admins */}
      <Dialog
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        title={t('scanQRTitle')}
        description={t('scanQRDesc')}
      >
        <div className="py-4">
          <QRScanner
            onScan={handleQRScanned}
            onClose={() => setShowScanner(false)}
          />
        </div>
      </Dialog>

      {/* Manual Check-in Modal for Admins / Hosts */}
      <Dialog
        isOpen={showManualDialog}
        onClose={() => setShowManualDialog(false)}
        title={t('manualCheckinTitle')}
        description={t('manualCheckinDesc')}
      >
        <div className="flex flex-col gap-3 py-2 max-h-80 overflow-y-auto">
          <Input
            placeholder={t('searchMembers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          {activeMembers.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">
              {t('noActiveMembersAvailable')}
            </p>
          ) : (
            filteredActiveMembers.map((member: any) => (
              <button
                key={member.member_id}
                type="button"
                onClick={() => {
                  if (manualCheckInMutation.isPending) return;
                  manualCheckInMutation.mutate(member.member_id);
                }}
                disabled={manualCheckInMutation.isPending}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-active transition-colors text-left w-full"
              >
                <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-gold">
                    {member.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {member.user?.name ?? t('unknownMember')}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {member.user?.phone ?? ""}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-status-success shrink-0" />
              </button>
            ))
          )}
        </div>
      </Dialog>

      {/* User Check-in QR Code Modal */}
      <Dialog
        isOpen={showUserQR}
        onClose={() => setShowUserQR(false)}
        title={t('myQRTitle')}
        description={t('myQRDesc')}
      >
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {isUserQRLoading ? (
            <Skeleton className="w-[232px] h-[232px] rounded-xl" />
          ) : userQRCode?.qr_code ? (
            <>
              <QRCode dataUrl={userQRCode.qr_code} size={200} />
              <Button
                variant="outline"
                onClick={() => downloadQRCode(userQRCode.qr_code, `${event?.title ?? "checkin"}-qr.png`)}
              >
                {t('downloadQR')}
              </Button>
            </>
          ) : (
            <div className="text-status-error">{t('qrGenerateFailed')}</div>
          )}
          <p className="text-sm text-center text-text-secondary max-w-[250px]">
            {t('myQRDisplayDesc')}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
