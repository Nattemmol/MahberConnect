"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { eventService, memberService } from "@/lib/api/service-factory";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { canManageEvents } from "@/lib/utils";

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
  recurrence_pattern: z.enum(["None", "Weekly", "Monthly"]).optional().default("None"),
  recurrence_end_date: z.string().optional(),
}).refine(data => {
  if (data.recurrence_pattern && data.recurrence_pattern !== "None") {
    if (!data.recurrence_end_date) return false;
    const start = new Date(data.start_time);
    const end = new Date(data.recurrence_end_date);
    if (end <= start) return false;
    
    // max 1 year
    const maxEnd = new Date(start);
    maxEnd.setFullYear(maxEnd.getFullYear() + 1);
    if (end > maxEnd) return false;
  }
  return true;
}, {
  message: "End date must be provided, after start time, and within 1 year.",
  path: ["recurrence_end_date"]
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function CreateEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: currentMember, isLoading: isMemberLoading } = useQuery({
    queryKey: ["mahber-member", id, user?.id],
    queryFn: () => memberService.getMemberById(id, user?.id || ""),
    enabled: !!user?.id,
  });
  const canManageEventsValue = canManageEvents(currentMember);

  const { data: members } = useQuery({
    queryKey: ["mahber-members", id],
    queryFn: () => memberService.getMembers(id),
    enabled: canManageEventsValue,
  });

  const activeMembers = useMemo(() => {
    if (!members?.data) return [];
    return members.data.filter((m: any) => m.status === "Active");
  }, [members]);

  useEffect(() => {
    if (!isMemberLoading && user && !canManageEventsValue) {
      toast.error("You don't have permission to create events");
      router.push(`/mahbers/${id}/events`);
    }
  }, [isMemberLoading, user, canManageEventsValue, router, id]);

  const [selectedHostId, setSelectedHostId] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_type: "Meeting",
      is_mandatory: false,
      recurrence_pattern: "None",
      recurrence_end_date: "",
    },
  });

  const recurrencePattern = watch("recurrence_pattern");

  const getErrorMessage = (error: unknown) => {
    if (!error || typeof error !== "object") return undefined;
    if ("response" in error) {
      return (error as { response?: { data?: { message?: string } } }).response
        ?.data?.message;
    }
    return undefined;
  };

  const onSubmit = async (data: EventFormValues) => {
    try {
      const payload = { ...data, host_id: selectedHostId || undefined };
      if (payload.recurrence_pattern === "None") {
        delete payload.recurrence_end_date;
      }
      await eventService.createEvent(id, payload);
      toast.success("Event created successfully!");
      router.push(`/mahbers/${id}/events`);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast.error(message ?? "Failed to create event");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Create Event"
        description="Schedule a new gathering for your community."
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
            {/* Recurrence Section */}
            <div className="p-4 bg-background-dark/30 rounded-input border border-border-glass">
              <h4 className="text-sm font-semibold text-text-primary mb-3">Recurrence</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Repeat Pattern
                  </label>
                  <select
                    {...register("recurrence_pattern")}
                    className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                  >
                    <option value="None">Does not repeat</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                {recurrencePattern !== "None" && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      End Date
                    </label>
                    <Input
                      type="datetime-local"
                      {...register("recurrence_end_date")}
                      className={errors.recurrence_end_date ? "border-status-error" : ""}
                    />
                    {errors.recurrence_end_date && (
                      <p className="text-status-error text-xs mt-1">
                        {errors.recurrence_end_date.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assign Host */}
            <div className="p-4 bg-background-dark/30 rounded-input border border-border-glass">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Assign Host (Optional)
              </label>
              <select
                value={selectedHostId}
                onChange={(e) => setSelectedHostId(e.target.value)}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
              >
                <option value="">No host assigned</option>
                {activeMembers.map((member: any) => (
                  <option key={member.member_id} value={member.member_id}>
                    {member.user?.name ?? "Unknown"} — {member.user?.phone ?? ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                The host can manage invitations and record attendance for this event.
              </p>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-border-glass">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Event
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
