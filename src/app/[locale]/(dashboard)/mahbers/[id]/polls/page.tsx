"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, BarChart2, CheckCircle2, Clock } from "lucide-react";
import { communicationService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import toast from "react-hot-toast";

export default function PollsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Polls");
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?.id || "usr_3";
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const { data: pollsResponse, isLoading } = useQuery({
    queryKey: ["mahber-polls", id],
    queryFn: () => communicationService.getPolls(id),
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, choices }: { pollId: string; choices: string[] }) =>
      communicationService.vote(id, pollId, choices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-polls", id] });
      toast.success(t("voteSubmitted"));
    },
    onError: (err: any) => toast.error(err.message || t("voteFailed")),
  });

  const polls = pollsResponse?.data || [];

  const handleVote = (pollId: string) => {
    const choice = selectedOptions[pollId];
    if (!choice) return;
    voteMutation.mutate({ pollId, choices: [choice] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      >
        <Button asChild className="gap-2">
          <Link href={`/mahbers/${id}/polls/create`}>
            <Plus className="w-4 h-4" />
            {t("createPoll")}
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12 glass rounded-card">
          <BarChart2 className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary">{t("noPolls")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {polls.map((poll) => {
            const hasVoted = poll.votes?.some(
              (v) => v.member_id === currentUserId,
            );
            const totalVotes = poll.votes?.length || 0;
            const isClosed =
              poll.is_closed || new Date(poll.voting_deadline) <= new Date();

            return (
              <Card key={poll.id} className={isClosed ? "opacity-75" : ""}>
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="text-lg font-bold text-text-primary leading-tight">
                        {poll.question}
                      </h3>
                      <Badge
                        variant={isClosed ? "secondary" : "default"}
                        className={
                          !isClosed ? "bg-gold text-background-dark" : ""
                        }
                      >
                        {isClosed ? t("closed") : t("active")}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      {poll.options.map((option) => {
                        const showResults = hasVoted || isClosed;
                        const optionVotes =
                          poll.votes?.filter((v) =>
                            v.choices.includes(option.id),
                          ).length || 0;
                        const percentage =
                          totalVotes > 0
                            ? Math.round((optionVotes / totalVotes) * 100)
                            : 0;
                        const isSelected =
                          selectedOptions[poll.id] === option.id;
                        const votedForThis = poll.votes?.some(
                          (v) =>
                            v.member_id === currentUserId &&
                            v.choices.includes(option.id),
                        );

                        if (showResults) {
                          return (
                            <div key={option.id} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span
                                  className={`flex items-center gap-2 ${votedForThis ? "font-bold text-gold" : "text-text-secondary"}`}
                                >
                                  {option.text}
                                  {votedForThis && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                </span>
                                <span className="text-text-muted">
                                  {percentage}% ({optionVotes})
                                </span>
                              </div>
                              <div className="h-2 w-full bg-surface-active rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${votedForThis ? "bg-gold" : "bg-text-muted/50"} transition-all duration-1000`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        }

                        return (
                          <label
                            key={option.id}
                            className={`flex items-center p-3 rounded-input border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-gold bg-gold/5 text-text-primary"
                                : "border-border-glass bg-background-dark/30 hover:border-text-muted text-text-secondary"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`poll-${poll.id}`}
                              value={option.id}
                              checked={isSelected}
                              onChange={() =>
                                setSelectedOptions({
                                  ...selectedOptions,
                                  [poll.id]: option.id,
                                })
                              }
                              className="w-4 h-4 text-gold border-border-glass focus:ring-gold bg-transparent mr-3"
                            />
                            <span className="text-sm font-medium">
                              {option.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-glass">
                      <div className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isClosed
                          ? t("ended", {
                              date: new Date(
                                poll.voting_deadline,
                              ).toLocaleDateString(),
                            })
                          : t("ends", {
                              date: new Date(
                                poll.voting_deadline,
                              ).toLocaleDateString(),
                            })}
                        <span className="mx-2">•</span>
                        {t("votes", { count: totalVotes })}
                      </div>

                      {!hasVoted && !isClosed && (
                        <Button
                          size="sm"
                          disabled={
                            !selectedOptions[poll.id] || voteMutation.isPending
                          }
                          isLoading={
                            voteMutation.isPending &&
                            voteMutation.variables?.pollId === poll.id
                          }
                          onClick={() => handleVote(poll.id)}
                        >
                          {t("submitVote")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
