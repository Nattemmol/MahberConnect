"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { mahberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const createMahberSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name is too long"),
  type: z.enum(["MAHBER", "EQUB", "IDDIR"]),
  configuration: z.object({
    contribution_amount: z
      .number({ error: "Contribution amount is required" })
      .min(1, "Contribution amount must be greater than 0"),
    cycle: z.string().min(1, "Contribution cycle is required"),
    payment_frequency: z.string().optional(),
    join_fee_required: z.boolean(),
    join_fee_amount: z.number().min(0),
    penalty_rate: z.number().min(0),
    penalty_mode: z.enum(["fixed", "percentage"]),
    penalty_interval: z.string().min(1, "Penalty interval is required"),
    max_fine_total: z.number().min(0),
  }),
  is_public: z.boolean(),
  invitation_code: z.string().optional(),
});

type CreateMahberValues = z.infer<typeof createMahberSchema>;

export default function CreateMahberPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMahberValues>({
    resolver: zodResolver(createMahberSchema),
    defaultValues: {
      type: "MAHBER",
      is_public: false,
      configuration: {
        contribution_amount: 500,
        cycle: "Monthly",
        payment_frequency: "Monthly",
        join_fee_required: false,
        join_fee_amount: 0,
        penalty_rate: 0,
        penalty_mode: "fixed",
        penalty_interval: "30d",
        max_fine_total: 0,
      },
      invitation_code: "",
    },
  });

  const onSubmit = async (data: CreateMahberValues) => {
    try {
      const payload = {
        ...data,
        invitation_code: data.invitation_code?.trim() || undefined,
        configuration: {
          ...data.configuration,
          payment_frequency:
            data.configuration.payment_frequency ?? data.configuration.cycle,
        },
      };
      const newMahber = await mahberService.createMahber(payload);
      toast.success("Mahber created successfully!");
      router.push(`/mahbers/${newMahber.id}`);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      toast.error(error.response?.data?.message || "Failed to create Mahber");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Create Mahber"
        description="Initialize a new community, equb, or iddir."
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Community Name
              </label>
              <input
                type="text"
                placeholder="e.g. Addis Tech Equb"
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
                Organization Type
              </label>
              <select
                {...register("type")}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
              >
                <option value="MAHBER">Mahber (General Community)</option>
                <option value="EQUB">Equb (Rotating Savings)</option>
                <option value="IDDIR">Iddir (Emergency Fund)</option>
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
                  Contribution Amount
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 500"
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
                  Payment Frequency
                </label>
                <select
                  {...register("configuration.cycle")}
                  className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.configuration?.cycle ? "border-status-error" : "border-border-glass"} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none`}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
                {errors.configuration?.cycle && (
                  <p className="text-status-error text-xs mt-1">
                    {errors.configuration.cycle.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-4 border border-border-glass rounded-input bg-background-dark/30">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Join Fee Required
                  </p>
                  <p className="text-xs text-text-secondary">
                    Charge members before activation.
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
                  Join Fee Amount
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 150"
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
                  Penalty Rate
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 50"
                  {...register("configuration.penalty_rate", {
                    valueAsNumber: true,
                  })}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Penalty Mode
                </label>
                <select
                  {...register("configuration.penalty_mode")}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Penalty Interval
                </label>
                <input
                  type="text"
                  placeholder="30d"
                  {...register("configuration.penalty_interval")}
                  className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Maximum Unpaid Fine Total
              </label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 1000"
                {...register("configuration.max_fine_total", {
                  valueAsNumber: true,
                })}
                className="w-full px-4 py-3 bg-background-dark/50 border border-border-glass rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors"
              />
              <p className="text-xs text-text-muted mt-1">
                When unpaid fines exceed this amount, the member is
                automatically banned.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Invitation Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. INV-ABC123"
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
                  Make Public
                </label>
                <p className="text-xs text-text-secondary">
                  If public, anyone can discover and request to join.
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Community
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
