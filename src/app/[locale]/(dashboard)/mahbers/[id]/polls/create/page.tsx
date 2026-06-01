"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { communicationService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CreatePollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("CreatePoll");
  const router = useRouter();

  const pollSchema = z.object({
    question: z.string().min(5, t("questionTooShort")),
    options: z
      .array(z.object({ text: z.string().min(1, t("optionTextRequired")) }))
      .min(2, t("atLeastTwoOptions")),
    voting_deadline: z.string().min(1, t("deadlineRequired")),
  });

  type PollFormValues = z.infer<typeof pollSchema>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      options: [{ text: "" }, { text: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const onSubmit = async (data: PollFormValues) => {
    try {
      await communicationService.createPoll(id, {
        question: data.question,
        options: data.options.map((o) => o.text),
        poll_type: "SINGLE_CHOICE",
        voting_deadline: data.voting_deadline,
      });
      toast.success(t("pollCreated"));
      router.push(`/mahbers/${id}/polls`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("pollFailed"));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("question")}
              </label>
              <Input
                placeholder={t("questionPlaceholder")}
                {...register("question")}
                className={errors.question ? "border-status-error" : ""}
              />
              {errors.question && (
                <p className="text-status-error text-xs mt-1">
                  {errors.question.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-secondary">
                {t("options")}
              </label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={t("optionPlaceholder", { number: index + 1 })}
                      {...register(`options.${index}.text` as const)}
                      className={
                        errors.options?.[index]?.text
                          ? "border-status-error"
                          : ""
                      }
                    />
                    {errors.options?.[index]?.text && (
                      <p className="text-status-error text-xs mt-1">
                        {errors.options[index]?.text?.message}
                      </p>
                    )}
                  </div>
                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-status-error border-border-glass hover:bg-status-error/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.options && !Array.isArray(errors.options) && (
                <p className="text-status-error text-xs">
                  {errors.options.message}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 border-dashed"
                onClick={() => append({ text: "" })}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("addOption")}
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t("votingDeadline")}
              </label>
              <Input
                type="datetime-local"
                {...register("voting_deadline")}
                className={errors.voting_deadline ? "border-status-error" : ""}
              />
              {errors.voting_deadline && (
                <p className="text-status-error text-xs mt-1">
                  {errors.voting_deadline.message}
                </p>
              )}
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-border-glass">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {t("publishPoll")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
