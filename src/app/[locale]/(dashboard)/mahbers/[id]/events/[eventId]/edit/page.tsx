"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserX } from "lucide-react";
import { eventService, memberService } from "@/lib/api/service-factory";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { canManageEvents } from "@/lib/utils";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const t = useTranslations("EventDetail");

  const eventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    event_type: z.enum([
      "Meeting",
      "Ceremony",
      "Fundraiser",
      "Social_Gathering",
    ]),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    is_mandatory: z.boolean().optional(),
  });

  type EventFormValues = z.infer<typeof eventSchema>;

  const { data: currentMember, isLoading: isMemberLoading } = useQuery({
    queryKey: ["mahber-member", id, user?.id],
    queryFn: () => memberService.getMemberById(id, user?.id || ""),
    enabled: !!user?.id,
  });
  const canManageEventsValue = canManageEvents(currentMember);

  const [selectedHostId, setSelectedHostId] = useState<string>("");

  const { data: members } = useQuery({
    queryKey: ["mahber-members", id],
    queryFn: () => memberService.getMembers(id),
    enabled: canManageEventsValue,
  });

  const activeMembers = useMemo(() => {
    if (!members?.data) return [];
    return members.data.filter((m: any) => m.status === "Active");
  }, [members]);

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ["mahber-event", id, eventId],
    queryFn: () => eventService.getEventById(id, eventId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_type: "Meeting",
      is_mandatory: false,
    },
  });

  // Reset form when event data loads
  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        start_time: formatDateTimeLocal(new Date(event.start_time)),
        end_time: formatDateTimeLocal(new Date(event.end_time)),
        location: event.location,
        is_mandatory: event.is_mandatory,
      });
    }
  }, [event, reset]);

  // Helper to format Date to datetime-local input format
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getErrorMessage = (error: unknown) => {
    if (!error || typeof error !== "object") return undefined;
    if ("response" in error) {
      return (error as { response?: { data?: { message?: string } } }).response
        ?.data?.message;
    }
    return undefined;
  };

  const updateMutation = useMutation({
    mutationFn: (data: EventFormValues) =>
      eventService.updateEvent(id, eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-events", id] });
      queryClient.invalidateQueries({
        queryKey: ["mahber-event", id, eventId],
      });
      toast.success(t('eventUpdated'));
      router.push(`/mahbers/${id}/events/${eventId}`);
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('updateFailed'));
    },
  });

  const assignHostMutation = useMutation({
    mutationFn: (memberId: string) =>
      eventService.assignEventHost(id, eventId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-event", id, eventId] });
      toast.success(t('hostAssigned'));
      setSelectedHostId("");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('assignHostFailed'));
    },
  });

  const removeHostMutation = useMutation({
    mutationFn: () => eventService.removeEventHost(id, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-event", id, eventId] });
      toast.success(t('hostRemoved'));
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message ?? t('removeHostFailed'));
    },
  });

  const onSubmit = (data: EventFormValues) => {
    updateMutation.mutate(data);
  };

  useEffect(() => {
    if (!isMemberLoading && user && !canManageEventsValue) {
      toast.error(t('noPermissionEdit'));
      router.push(`/mahbers/${id}/events/${eventId}`);
    }
  }, [isMemberLoading, user, canManageEventsValue, router, id, eventId]);

  if (isEventLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card className="h-96" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{t('eventNotFound')}</p>
        <Button
          variant="link"
          onClick={() => router.push(`/mahbers/${id}/events`)}
          className="mt-4"
        >
          {t('backToEvents')}
        </Button>
      </div>
    );
  }

  if (event.is_cancelled) {
    return (
      <div className="text-center py-12">
        <p className="text-status-warning">
          {t('eventCancelledCannotEdit')}
        </p>
        <Button
          variant="link"
          onClick={() => router.push(`/mahbers/${id}/events/${eventId}`)}
          className="mt-4"
        >
          {t('backToEvent')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </Button>

      <PageHeader
        title="Edit Event"
        description="Update event details for your community."
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Event Title
              </label>
              <Input
                placeholder="e.g., Monthly General Meeting"
                {...register("title")}
                className={errors.title ? "border-status-error" : ""}
              />
              {errors.title && (
                <p className="text-status-error text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Description
              </label>
              <textarea
                placeholder="Details about the event..."
                {...register("description")}
                className={`w-full min-h-[100px] px-4 py-3 bg-background-dark/50 border ${errors.description ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors resize-y`}
              />
              {errors.description && (
                <p className="text-status-error text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Event Type
                </label>
                <select
                  {...register("event_type")}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Ceremony">Ceremony</option>
                  <option value="Fundraiser">Fundraiser</option>
                  <option value="Social_Gathering">Social Gathering</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Location
                </label>
                <Input
                  placeholder="Venue or Online Link"
                  {...register("location")}
                  className={errors.location ? "border-status-error" : ""}
                />
                {errors.location && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Start Time
                </label>
                <Input
                  type="datetime-local"
                  {...register("start_time")}
                  className={errors.start_time ? "border-status-error" : ""}
                />
                {errors.start_time && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.start_time.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  End Time
                </label>
                <Input
                  type="datetime-local"
                  {...register("end_time")}
                  className={errors.end_time ? "border-status-error" : ""}
                />
                {errors.end_time && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.end_time.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-background-dark/30 rounded-input border border-border-glass">
              <input
                type="checkbox"
                id="is_mandatory"
                {...register("is_mandatory")}
                className="w-5 h-5 rounded border-border-glass text-gold focus:ring-gold bg-transparent"
              />
              <div className="flex flex-col">
                <label
                  htmlFor="is_mandatory"
                  className="text-sm font-medium text-text-primary cursor-pointer"
                >
                  Mandatory Attendance
                </label>
                <p className="text-xs text-text-muted">
                  Members may be fined for missing this event.
                </p>
              </div>
            </div>

            {/* Host Management */}
            <div className="p-4 bg-background-dark/30 rounded-input border border-border-glass space-y-3">
              <h4 className="text-sm font-semibold text-text-primary">Event Host</h4>
              {event.host_user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                      Host: {event.host_user.name}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHostMutation.mutate()}
                    isLoading={removeHostMutation.isPending}
                    className="text-status-error gap-1"
                  >
                    <UserX className="w-3 h-3" />
                    Remove
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-text-muted">No host assigned.</p>
              )}
              <div className="flex gap-2">
                <select
                  value={selectedHostId}
                  onChange={(e) => setSelectedHostId(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none text-sm"
                >
                  <option value="">Select a member...</option>
                  {activeMembers
                    .filter((m: any) => m.member_id !== event.host_id)
                    .map((member: any) => (
                      <option key={member.member_id} value={member.member_id}>
                        {member.user?.name ?? "Unknown"}
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!selectedHostId) {
                      toast.error("Please select a member");
                      return;
                    }
                    assignHostMutation.mutate(selectedHostId);
                  }}
                  isLoading={assignHostMutation.isPending}
                  disabled={!selectedHostId}
                >
                  Assign Host
                </Button>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-border-glass">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting || updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
