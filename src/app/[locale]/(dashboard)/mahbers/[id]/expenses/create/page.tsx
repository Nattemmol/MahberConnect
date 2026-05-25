"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { financialService, memberService } from "@/lib/api/service-factory";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ExpenseCategory, Bank } from "@/lib/types";

const expenseSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  reason: z
    .string()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason is too long"),
  category: z.enum(["Operational", "Maintenance", "Event", "Other"], {
    error: "Category is required",
  }),
  recipient_name: z
    .string()
    .min(2, "Recipient name is required"),
  recipient_account_type: z.enum(["bank", "telebirr"], {
    error: "Account type is required",
  }),
  recipient_account: z
    .string()
    .min(5, "Account number is required"),
  recipient_bank_code: z.string().optional(),
}).refine(
  (data) => {
    if (data.recipient_account_type === "bank" && !data.recipient_bank_code) {
      return false;
    }
    return true;
  },
  { message: "Bank selection is required for bank accounts", path: ["recipient_bank_code"] },
);

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "Operational", label: "Operational" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Event", label: "Event" },
  { value: "Other", label: "Other" },
];

export default function CreateExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
  });

  const myMembership = membersResponse?.data?.find(
    (m) => m.user?.id === user?.id,
  );

  const isTreasurer = membersResponse
    ? (myMembership?.role as any)?.permissions?.includes("create_expense")
    : false;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      reason: "",
      category: undefined,
      recipient_name: "",
      recipient_account_type: undefined,
      recipient_account: "",
      recipient_bank_code: "",
    },
  });

  const [categoryValue, setCategoryValue] = useState<ExpenseCategory | "">("");
  const [accountType, setAccountType] = useState<"bank" | "telebirr" | "">("");
  const [bankSearch, setBankSearch] = useState("");

  const { data: banksData } = useQuery({
    queryKey: ["chapa-banks"],
    queryFn: () => financialService.getBanks(),
    staleTime: 5 * 60 * 1000,
  });

  const banks = banksData ?? [];
  const filteredBanks = useMemo(
    () =>
      banks.filter(
        (b) =>
          b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
          String(b.code).toLowerCase().includes(bankSearch.toLowerCase()),
      ),
    [banks, bankSearch],
  );
  const accountTypeValue = watch("recipient_account_type");

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await financialService.createExpense(id, {
        amount: Number(data.amount),
        reason: data.reason,
        category: data.category,
        recipient_name: data.recipient_name,
        recipient_account_type: data.recipient_account_type,
        recipient_account: data.recipient_account,
        recipient_bank_code: data.recipient_account_type === "bank" ? data.recipient_bank_code : undefined,
      });
      toast.success("Expense submitted for approval!");
      router.push(`/mahbers/${id}/payments`);
    } catch (err) {
      const error = err as any;
      const data = error.response?.data;
      let serverMsg = "Failed to record expense";
      if (typeof data === "string") {
        serverMsg = data;
      } else if (data?.message) {
        serverMsg = data.message;
      } else if (Array.isArray(data?.errors)) {
        serverMsg = data.errors.join(", ");
      } else if (error.response?.status === 403) {
        serverMsg = "You don't have permission to create expenses. Only treasurers can create expenses.";
      } else if (error.response?.status === 400) {
        serverMsg = `Request rejected (${error.response.statusText || 400})`;
      }
      toast.error(serverMsg);
    }
  };

  if (!isTreasurer) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Record Expense"
          description="Record a new expense or debit for this community."
        />
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-text-secondary text-lg">
              You do not have permission to create expenses. Only treasurers can submit expenses for approval.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Record Expense"
        description="Submit an expense for admin approval and payment."
      >
        <div className="bg-status-warning/10 border border-status-warning/30 rounded-card px-4 py-2 text-sm text-status-warning">
          This expense will need admin approval before payment is processed.
        </div>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Amount (ETB)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 1500"
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
                Reason
              </label>
              <textarea
                placeholder="Describe the reason for this expense..."
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
                Category
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
                <option value="">Select a category...</option>
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

            <hr className="border-border-glass" />

            <h3 className="text-sm font-semibold text-text-primary">
              Payment Recipient
            </h3>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                placeholder="Person or business name"
                {...register("recipient_name")}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.recipient_name ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
              />
              {errors.recipient_name && (
                <p className="text-status-error text-xs mt-1">
                  {errors.recipient_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => {
                  const val = e.target.value as "bank" | "telebirr" | "";
                  setAccountType(val);
                  if (val) setValue("recipient_account_type", val);
                  if (val !== "bank") {
                    setValue("recipient_bank_code", "");
                    setBankSearch("");
                  }
                }}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.recipient_account_type ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none`}
              >
                <option value="">Select account type...</option>
                <option value="bank">Bank Account</option>
                <option value="telebirr">Telebirr</option>
              </select>
              {errors.recipient_account_type && (
                <p className="text-status-error text-xs mt-1">
                  {errors.recipient_account_type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {accountType === "telebirr" ? "Telebirr Number" : "Account Number"}
              </label>
              <input
                type="text"
                placeholder={accountType === "telebirr" ? "e.g. 0911XXXXXX" : "e.g. 100013456789"}
                {...register("recipient_account")}
                className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.recipient_account ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
              />
              {errors.recipient_account && (
                <p className="text-status-error text-xs mt-1">
                  {errors.recipient_account.message}
                </p>
              )}
            </div>

            {accountType === "bank" && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Bank
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search banks..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors mb-2"
                  />
                </div>
                <select
                  size={Math.min(filteredBanks.length || 1, 6)}
                  {...register("recipient_bank_code")}
                  className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.recipient_bank_code ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none`}
                >
                  {filteredBanks.length === 0 ? (
                    <option value="" disabled>No banks found</option>
                  ) : (
                    filteredBanks.map((bank) => (
                      <option key={bank.id} value={bank.code}>
                        {bank.name} ({bank.code})
                      </option>
                    ))
                  )}
                </select>
                {errors.recipient_bank_code && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.recipient_bank_code.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border-glass text-text-secondary hover:text-text-primary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gold hover:bg-gold-dark text-black font-medium"
                isLoading={isSubmitting}
              >
                Submit for Approval
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
