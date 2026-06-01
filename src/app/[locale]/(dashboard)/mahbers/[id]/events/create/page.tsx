"use client";

import { useTranslations } from "next-intl";
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

export default function CreateEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("CreateEvent");
  const { id } = use(params);
  const router = useRouter();

  const getEventSchema = () => z.object({
    title: z.string().min(3, t('titleTooShort')),
    description: z.string().min(10, t('descriptionTooShort')),
    event_type: z.enum([
      "Meeting",
      "Ceremony",
      "Fundraiser",
      "Social_Gathering",
    ]),
    start_time: z.string().min(1, t('startRequired')),
    end_time: z.string().min(1, t('endRequired')),
    location: z.string().min(3, t('locationTooShort')),
    is_mandatory: z.boolean().optional(),
  });
  type EventFormValues = z.infer<ReturnType<typeof getEventSchema>>;
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
      toast.error(t('noPermission'));
      router.push(`/mahbers/${id}/events`);
    }
  }, [isMemberLoading, user, canManageEventsValue, router, id]);

  const [selectedHostId, setSelectedHostId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(getEventSchema()),
    defaultValues: {
      event_type: "Meeting",
      is_mandatory: false,
    },
  });

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
      await eventService.createEvent(id, {
        ...data,
        host_id: selectedHostId || undefined,
      });
      toast.success(t('eventCreated'));
      router.push(`/mahbers/${id}/events`);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast.error(message ?? t('creationFailed'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('eventTitle')}
              </label>
              <Input
                placeholder={t('eventTitlePlaceholder')}
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
                {t('description')}
              </label>
              <textarea
                placeholder={t('descriptionPlaceholder')}
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
                  {t('eventType')}
                </label>
                  <select
                  {...register("event_type")}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                >
                  <option value="Meeting">{t('meeting')}</option>
                  <option value="Ceremony">{t('ceremony')}</option>
                  <option value="Fundraiser">{t('fundraiser')}</option>
                  <option value="Social_Gathering">{t('socialGathering')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('location')}
                </label>
                <Input
                  placeholder={t('locationPlaceholder')}
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
                  {t('startTime')}
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
                  {t('endTime')}
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
                  {t('mandatoryAttendance')}
                </label>
                <p className="text-xs text-text-muted">
                  {t('mandatoryAttendanceDesc')}
                </p>
              </div>
            </div>

            {/* Assign Host */}
            <div className="p-4 bg-background-dark/30 rounded-input border border-border-glass">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('assignHost')}
              </label>
              <select
                value={selectedHostId}
                onChange={(e) => setSelectedHostId(e.target.value)}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
              >
                <option value="">{t('noHostAssigned')}</option>
                {activeMembers.map((member: any) => (
                  <option key={member.member_id} value={member.member_id}>
                    {member.user?.name ?? t('unknown')} — {member.user?.phone ?? ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                {t('hostDesc')}
              </p>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-border-glass">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {t('createEvent')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
