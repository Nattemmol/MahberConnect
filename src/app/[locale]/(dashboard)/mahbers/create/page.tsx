"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { mahberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PaymentFrequency } from "@/lib/types";

type CreateMahberValues = z.infer<ReturnType<typeof getCreateMahberSchema>>;

export default function CreateMahberPage() {
  const t = useTranslations("CreateMahber");
  const router = useRouter();

  const getCreateMahberSchema = () => z
    .object({
      name: z
        .string()
        .min(3, t('nameTooShort'))
        .max(50, t('nameTooLong')),
      type: z.enum(["MAHBER", "EQUB"]),
      configuration: z.object({
        contribution_amount: z
          .number({ error: t('contributionRequired') })
          .min(1, t('contributionPositive')),
        cycle: z.string().min(1, t('cycleRequired')),
        payment_frequency: z.string().optional(),
        payment_day: z.number().optional(),
        join_fee_required: z.boolean(),
        join_fee_amount: z.number().min(0),
        penalty_rate: z.number().min(0),
        penalty_mode: z.enum(["fixed", "percentage"]),
        penalty_interval: z.string().min(1, "Penalty interval is required"),
        max_fine_total: z.number().min(0),
        operation_cost_rate: z.number().optional(),
      }),
      is_public: z.boolean(),
      invitation_code: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.type === "EQUB" && (value.configuration.operation_cost_rate ?? 0) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["configuration", "operation_cost_rate"],
          message: t('operationCostRequired'),
        });
      }
    });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMahberValues>({
    resolver: zodResolver(getCreateMahberSchema()),
    defaultValues: {
      type: "MAHBER",
      is_public: false,
      configuration: {
        contribution_amount: 500,
        cycle: "Monthly",
        payment_frequency: "Monthly",
        payment_day: 1,
        join_fee_required: false,
        join_fee_amount: 0,
        penalty_rate: 0,
        penalty_mode: "fixed",
        penalty_interval: "30d",
        max_fine_total: 0,
        operation_cost_rate: 0,
      },
      invitation_code: "",
    },
  });

  const watchConfigurationCycle = watch("configuration.cycle");
  const selectedType = watch("type");

  const onSubmit = async (data: CreateMahberValues) => {
    try {
      const payload = {
        ...data,
        invitation_code: data.invitation_code?.trim() || undefined,
        configuration: {
          ...data.configuration,
          payment_frequency:
            (data.configuration.payment_frequency as PaymentFrequency) ?? (data.configuration.cycle as PaymentFrequency),
        },
      };
      const newMahber = await mahberService.createMahber(payload);
      toast.success(t('createdSuccess'));
      router.push(`/mahbers/${newMahber.id}`);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      toast.error(error.response?.data?.message || t('createFailed'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('communityName')}
              </label>
              <input
                type="text"
                placeholder={t('communityNamePlaceholder')}
                {...register("name")}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.name ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
              />
              {errors.name && (
                <p className="text-status-error text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('orgType')}
              </label>
              <select
                {...register("type")}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
              >
                <option value="MAHBER">{t('mahberOption')}</option>
                <option value="EQUB">{t('equbOption')}</option>
              </select>
              {errors.type && (
                <p className="text-status-error text-xs mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('contributionAmount')}
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder={t('contributionPlaceholder')}
                  {...register("configuration.contribution_amount", {
                    valueAsNumber: true,
                  })}
                  className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.configuration?.contribution_amount ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
                />
                {errors.configuration?.contribution_amount && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.configuration.contribution_amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('paymentFrequency')}
                </label>
                <select
                  {...register("configuration.cycle")}
                  className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.configuration?.cycle ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none`}
                >
                  <option value="Daily">{t('daily')}</option>
                  <option value="Weekly">{t('weekly')}</option>
                  <option value="Monthly">{t('monthly')}</option>
                  <option value="Quarterly">{t('quarterly')}</option>
                </select>
                {errors.configuration?.cycle && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.configuration.cycle.message}
                  </p>
                )}
              </div>
            </div>

            {watchConfigurationCycle === 'Weekly' ? (
              <div className="grid gap-4 sm:grid-cols-1">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {t('paymentDayOfWeek')}
                  </label>
                  <select
                    {...register("configuration.payment_day", { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                  >
                    <option value={1}>{t('monday')}</option>
                    <option value={2}>{t('tuesday')}</option>
                    <option value={3}>{t('wednesday')}</option>
                    <option value={4}>{t('thursday')}</option>
                    <option value={5}>{t('friday')}</option>
                    <option value={6}>{t('saturday')}</option>
                    <option value={0}>{t('sunday')}</option>
                  </select>
                </div>
              </div>
            ) : watchConfigurationCycle === 'Monthly' || watchConfigurationCycle === 'Quarterly' ? (
              <div className="grid gap-4 sm:grid-cols-1">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {t('paymentDayOfMonth')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder={t('paymentDayPlaceholder')}
                    {...register("configuration.payment_day", { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-4 border border-border-glass rounded-input bg-background-dark/30">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {t('joinFeeRequired')}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {t('joinFeeDesc')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register("configuration.join_fee_required")}
                  className="w-5 h-5 accent-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('joinFeeAmount')}
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder={t('joinFeePlaceholder')}
                  {...register("configuration.join_fee_amount", {
                    valueAsNumber: true,
                  })}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('penaltyRate')}
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder={t('penaltyRatePlaceholder')}
                  {...register("configuration.penalty_rate", {
                    valueAsNumber: true,
                  })}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('penaltyMode')}
                </label>
                <select
                  {...register("configuration.penalty_mode")}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                >
                  <option value="fixed">{t('fixed')}</option>
                  <option value="percentage">{t('percentage')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('penaltyInterval')}
                </label>
                <input
                  type="text"
                  placeholder={t('penaltyIntervalPlaceholder')}
                  {...register("configuration.penalty_interval")}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('maxFineTotal')}
              </label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder={t('maxFineTotalPlaceholder')}
                {...register("configuration.max_fine_total", {
                  valueAsNumber: true,
                })}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
              />
              <p className="text-xs text-text-muted mt-1">
                {t('maxFineTotalDesc')}
              </p>
            </div>

            {selectedType === "EQUB" && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('operationCostRate')}
                </label>
                <input
                  type="number"
                  min={0.01}
                  max={100}
                  step={0.01}
                  placeholder={t('operationCostRatePlaceholder')}
                  {...register("configuration.operation_cost_rate", {
                    valueAsNumber: true,
                  })}
                  className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.configuration?.operation_cost_rate ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
                />
                <p className="text-xs text-text-muted mt-1">
                  {t('operationCostRateDesc')}
                </p>
                {errors.configuration?.operation_cost_rate && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.configuration.operation_cost_rate.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('invitationCode')}
              </label>
              <input
                type="text"
                placeholder={t('invitationCodePlaceholder')}
                {...register("invitation_code")}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.invitation_code ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
              />
              {errors.invitation_code && (
                <p className="text-status-error text-xs mt-1">
                  {errors.invitation_code.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 border border-border-glass rounded-input bg-background-dark/30">
              <input
                type="checkbox"
                id="is_public"
                {...register("is_public")}
                className="w-5 h-5 accent-gold bg-surface border-border-glass rounded cursor-pointer"
              />
              <div>
                <label
                  htmlFor="is_public"
                  className="text-sm font-medium text-text-primary cursor-pointer"
                >
                  {t('makePublic')}
                </label>
                <p className="text-xs text-text-secondary">
                  {t('makePublicDesc')}
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {t('createCommunity')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
