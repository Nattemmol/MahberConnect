"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { HandCoins, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { financialService, memberService } from "@/lib/api/service-factory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { PayoutCategory } from "@/lib/types";

export default function CreatePayoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("CreatePayout");
  const tPayouts = useTranslations("Payouts");

  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
  });

  const members = membersResponse?.data ?? [];

  const payoutCategoryOptions: { value: PayoutCategory; label: string }[] = [
    { value: "Iddir_Benefit", label: t("catIddirBenefit") },
    { value: "Event_Reimbursement", label: t("catEventReimbursement") },
    { value: "Recurring", label: t("catRecurring") },
    { value: "General", label: t("catGeneral") },
  ];

  const payoutSchema = z.object({
    member_id: z.string().min(1, t("selectRecipient")),
    amount: z.number().positive(t("amountPositive")),
    category: z.enum(["Iddir_Benefit", "Event_Reimbursement", "Recurring", "General"]),
    reason: z.string().min(3, t("reasonTooShort")),
  });

  type PayoutFormValues = z.infer<typeof payoutSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      member_id: "",
      amount: 0,
      category: "General",
      reason: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PayoutFormValues) =>
      financialService.createPayout(id, {
        member_id: data.member_id,
        amount: data.amount,
        category: data.category,
        reason: data.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-payouts", id] });
      queryClient.invalidateQueries({ queryKey: ["mahber-payouts-summary", id] });
      toast.success(t("createdSuccess"));
      router.push(`/mahbers/${id}/payouts`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || t("creationFailed"));
    },
  });

  const onSubmit = (data: PayoutFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href={`/mahbers/${id}/payouts`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-text-primary flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-gold" />
            {t("payoutDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("recipientMember")}
              </label>
              <select
                {...register("member_id")}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
              >
                <option value="">{t("selectMember")}</option>
                {members.map((m: any) => (
                  <option key={m.member_id ?? m.id} value={m.member_id ?? m.id}>
                    {m.user?.name ?? m.name ?? tPayouts("unknownMember")} ({m.user?.phone ?? m.phone ?? ""})
                  </option>
                ))}
              </select>
              {errors.member_id && (
                <p className="text-status-error text-xs mt-1">{errors.member_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("amount")}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder={t("amountPlaceholder")}
                {...register("amount", { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
              />
              {errors.amount && (
                <p className="text-status-error text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("category")}
              </label>
              <select
                {...register("category")}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
              >
                {payoutCategoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-status-error text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {t("reason")}
              </label>
              <textarea
                rows={3}
                placeholder={t("reasonPlaceholder")}
                {...register("reason")}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors resize-none"
              />
              {errors.reason && (
                <p className="text-status-error text-xs mt-1">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Link href={`/mahbers/${id}/payouts`}>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </Link>
              <Button
                type="submit"
                isLoading={isSubmitting || createMutation.isPending}
                className="gap-2"
              >
                <HandCoins className="w-4 h-4" />
                {t("createPayout")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
