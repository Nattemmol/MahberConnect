"use client";

import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { financialService, memberService } from "@/lib/api/service-factory";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ExpenseCategory } from "@/lib/types";

export default function CreateExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("CreateExpense");
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const expenseSchema = z.object({
    amount: z
      .number({ error: t('amountRequired') })
      .positive(t('amountPositive')),
    reason: z
      .string()
      .min(3, t('reasonTooShort'))
      .max(500, t('reasonTooLong')),
    category: z.enum(["Operational", "Maintenance", "Event", "Other"], {
      error: t('categoryRequired'),
    }),
  });

  type ExpenseFormValues = z.infer<typeof expenseSchema>;

  const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
    { value: "Operational", label: t('operational') },
    { value: "Maintenance", label: t('maintenance') },
    { value: "Event", label: t('event') },
    { value: "Other", label: t('other') },
  ];

  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
  });

  const myMembership = membersResponse?.data?.find(
    (m) => m.user?.id === user?.id,
  );

  const isAdmin = membersResponse
    ? (myMembership?.role as any) === "ADMIN" ||
      (myMembership?.role as any) === "Admin" ||
      (myMembership?.role as any)?.name === "Admin" ||
      (myMembership?.role as any)?.name === "ADMIN" ||
      (myMembership?.role as any)?.permissions?.includes("manage_members") ||
      (myMembership?.role as any)?.permissions?.includes("manage_finances")
    : false;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      reason: "",
      category: undefined,
    },
  });

  const [categoryValue, setCategoryValue] = useState<ExpenseCategory | "">("");

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await financialService.createExpense(id, {
        amount: Number(data.amount),
        reason: data.reason,
        category: data.category,
      });
      toast.success(t('recordSuccess'));
      router.push(`/mahbers/${id}/payments`);
    } catch (err) {
      const error = err as any;
      const data = error.response?.data;
      let serverMsg = t('recordFailed');
      if (typeof data === "string") {
        serverMsg = data;
      } else if (data?.message) {
        serverMsg = data.message;
      } else if (Array.isArray(data?.errors)) {
        serverMsg = data.errors.join(", ");
      } else if (error.response?.status === 400) {
        serverMsg = `Request rejected (${error.response.statusText || 400})`;
      }
      toast.error(serverMsg);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title={t('title')}
          description={t('description')}
        />
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-text-secondary text-lg">
              {t('noPermission')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {t('amount')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder={t('amountPlaceholder')}
                {...register("amount", { valueAsNumber: true })}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.amount ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
              />
              {errors.amount && (
                <p className="text-status-error text-xs mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('reason')}
              </label>
              <textarea
                placeholder={t('reasonPlaceholder')}
                rows={4}
                {...register("reason")}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.reason ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors resize-none`}
              />
              {errors.reason && (
                <p className="text-status-error text-xs mt-1">
                  {errors.reason.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('category')}
              </label>
              <select
                value={categoryValue}
                onChange={(e) => {
                  const val = e.target.value as ExpenseCategory | "";
                  setCategoryValue(val);
                  if (val) setValue("category", val as ExpenseCategory);
                }}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.category ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none`}
              >
                <option value="">{t('selectCategory')}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-status-error text-xs mt-1">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border-glass text-text-secondary hover:text-text-primary"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gold hover:bg-gold-dark text-black font-medium"
                isLoading={isSubmitting}
              >
                {t('recordExpense')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
