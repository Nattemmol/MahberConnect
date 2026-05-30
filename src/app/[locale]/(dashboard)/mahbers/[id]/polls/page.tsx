"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, BarChart2, CheckCircle2, Clock, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Trophy, GripVertical } from "lucide-react";
import { communicationService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import toast from "react-hot-toast";
import type { Vote } from "@/lib/types";

function RankedPollResults({ mahberId, pollId, options }: { mahberId: string, pollId: string, options: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const { data: results, isLoading } = useQuery({
    queryKey: ["poll-results", pollId],
    queryFn: () => communicationService.getPollResults(mahberId, pollId),
  });

  if (isLoading) return <div className="py-4"><Skeleton className="h-20 w-full" /></div>;
  if (!results) return <div className="text-sm text-text-muted">No results available.</div>;

  const winnerOption = results.irv_rounds?.length 
    ? options.find(o => o.id === results.irv_rounds![results.irv_rounds!.length - 1].winner)
    : undefined;

  return (
    <div className="space-y-4 mt-2">
      {winnerOption && (
        <div className="flex items-center gap-3 p-4 bg-gold/10 border border-gold/30 rounded-card">
          <Trophy className="w-6 h-6 text-gold" />
          <div>
            <div className="text-sm text-gold font-medium">Winner</div>
            <div className="text-lg font-bold text-text-primary">{winnerOption.text}</div>
          </div>
        </div>
      )}

      {results.irv_rounds && results.irv_rounds.length > 0 && (
        <div className="border border-border-glass rounded-card overflow-hidden">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between p-3 bg-surface-active/50 hover:bg-surface-active text-sm font-medium transition-colors"
          >
            <span>Show Voting Rounds ({results.irv_rounds.length} Rounds)</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expanded && (
            <div className="p-4 space-y-6 bg-background-dark/30">
              {results.irv_rounds.map((round) => (
                <div key={round.round} className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Round {round.round}
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(round.counts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([optId, count]) => {
                        const opt = options.find(o => o.id === optId);
                        const percentage = results.total_votes > 0 ? Math.round((count / results.total_votes) * 100) : 0;
                        return (
                          <div key={optId} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{opt?.text || optId}</span>
                              <span className="text-text-muted">{percentage}% ({count})</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-active rounded-full overflow-hidden">
                              <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {round.eliminated && round.eliminated.length > 0 && (
                    <div className="text-xs text-status-error bg-status-error/10 p-2 rounded">
                      Eliminated: {round.eliminated.map(eId => options.find(o => o.id === eId)?.text || eId).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PollsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?.id || "usr_3";
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [closedByError, setClosedByError] = useState<Record<string, boolean>>({});

  const { data: pollsResponse, isLoading } = useQuery({
    queryKey: ["mahber-polls", id],
    queryFn: () => communicationService.getPolls(id),
  });

  const voteMutation = useMutation<Vote, any, { pollId: string; choices: string[] }>({
    mutationFn: ({ pollId, choices }: { pollId: string; choices: string[] }) =>
      communicationService.voteUpsert(id, pollId, choices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-polls", id] });
      toast.success("Vote saved");
    },
    onError: (err: any, variables) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save vote";
      toast.error(String(message));
      if (String(message).toLowerCase().includes("closed")) {
        setClosedByError((prev) => ({ ...prev, [variables.pollId]: true }));
      }
    },
  });

  const polls = pollsResponse?.data || [];

  const myVotesByPollId = useMemo(() => {
    const map: Record<string, Vote | undefined> = {};
    for (const poll of polls) {
      const v = poll.votes?.find((vv) => String(vv.member_id) === String(currentUserId));
      if (v) map[poll.id] = v;
    }
    return map;
  }, [polls, currentUserId]);

  useEffect(() => {
    if (!polls.length) return;
    setSelectedOptions((prev) => {
      const next = { ...prev };
      for (const poll of polls) {
        if (next[poll.id]?.length) continue;
        const myVote = myVotesByPollId[poll.id];
        if (myVote?.choices?.length) {
          next[poll.id] = [...myVote.choices];
          continue;
        }
        if (poll.poll_type === "RANKED_CHOICE") {
          next[poll.id] = poll.options.map((o) => o.id);
        }
      }
      return next;
    });
  }, [polls, myVotesByPollId]);

  const handleVote = (pollId: string) => {
    const choices = selectedOptions[pollId] || [];
    if (choices.length === 0) return;
    voteMutation.mutate({ pollId, choices });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Polls & Voting"
        description="Participate in community decisions and view results."
      >
        <Button asChild className="gap-2">
          <Link href={`/mahbers/${id}/polls/create`}>
            <Plus className="w-4 h-4" />
            Create Poll
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
          <p className="text-text-secondary">No polls have been created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {polls.map((poll) => {
            const hasVoted = poll.votes?.some(
              (v) => v.member_id === currentUserId,
            );
            const totalVotes = poll.votes?.length || 0;
            const isClosed =
              Boolean(closedByError[poll.id]) ||
              poll.is_closed ||
              new Date(poll.voting_deadline) <= new Date();
            const canEdit = !isClosed;
            const myVote = myVotesByPollId[poll.id];

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
                        {isClosed ? "Closed" : "Active"}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      {poll.poll_type === "RANKED_CHOICE" && canEdit ? (
                        <div className="space-y-2">
                          <p className="text-sm text-text-secondary mb-3">Rank the options in your preferred order (1st is best).</p>
                          {(() => {
                            const rankArray = selectedOptions[poll.id] || poll.options.map(o => o.id);

                            const handleMove = (index: number, direction: 'up' | 'down') => {
                              const newRank = [...rankArray];
                              if (direction === 'up' && index > 0) {
                                [newRank[index - 1], newRank[index]] = [newRank[index], newRank[index - 1]];
                              } else if (direction === 'down' && index < newRank.length - 1) {
                                [newRank[index + 1], newRank[index]] = [newRank[index], newRank[index + 1]];
                              }
                              setSelectedOptions(prev => ({ ...prev, [poll.id]: newRank }));
                            };

                            return rankArray.map((optId, index) => {
                              const option = poll.options.find(o => o.id === optId);
                              if (!option) return null;
                              return (
                                <div key={option.id} className="flex items-center gap-3 p-3 rounded-input border border-border-glass bg-background-dark/30">
                                  <div className="flex flex-col gap-1">
                                    <button 
                                      onClick={() => handleMove(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 hover:bg-surface-active rounded text-text-muted disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleMove(index, 'down')}
                                      disabled={index === rankArray.length - 1}
                                      className="p-1 hover:bg-surface-active rounded text-text-muted disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex-1 text-sm font-medium">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-active text-text-secondary text-xs mr-3">
                                      {index + 1}
                                    </span>
                                    {option.text}
                                  </div>
                                  <GripVertical className="w-4 h-4 text-text-muted/50 cursor-move" />
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        // Standard or Voted View
                        <>
                          {(hasVoted || isClosed) && poll.poll_type === "RANKED_CHOICE" ? (
                             <RankedPollResults mahberId={id} pollId={poll.id} options={poll.options} />
                          ) : (
                            poll.options.map((option) => {
                              // Calculate percentage if results should be shown
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
                                (selectedOptions[poll.id] || []).includes(option.id);
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

                              // Voting view
                              return (
                                <label
                                  key={option.id}
                                  className={`flex items-center p-3 rounded-input border transition-colors ${
                                    isSelected
                                      ? "border-gold bg-gold/5 text-text-primary"
                                      : "border-border-glass bg-background-dark/30 hover:border-text-muted text-text-secondary"
                                  } ${canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                                >
                                  <input
                                    type={poll.poll_type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                                    name={`poll-${poll.id}`}
                                    value={option.id}
                                    checked={isSelected}
                                    disabled={!canEdit}
                                    onChange={() => {
                                      if (!canEdit) return;
                                      if (poll.poll_type === "MULTIPLE_CHOICE") {
                                        const current = selectedOptions[poll.id] || [];
                                        const next = current.includes(option.id)
                                          ? current.filter((x) => x !== option.id)
                                          : [...current, option.id];
                                        setSelectedOptions((prev) => ({ ...prev, [poll.id]: next }));
                                      } else {
                                        setSelectedOptions((prev) => ({ ...prev, [poll.id]: [option.id] }));
                                      }
                                    }}
                                    className="w-4 h-4 text-gold border-border-glass focus:ring-gold bg-transparent mr-3"
                                  />
                                  <span className="text-sm font-medium">
                                    {option.text}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-glass">
                      <div className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isClosed ? "Ended " : "Ends "}
                        {new Date(poll.voting_deadline).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                      </div>

                      {canEdit ? (
                        <Button
                          size="sm"
                          disabled={
                            (selectedOptions[poll.id]?.length ?? 0) === 0 ||
                            voteMutation.isPending
                          }
                          isLoading={
                            voteMutation.isPending &&
                            voteMutation.variables?.pollId === poll.id
                          }
                          onClick={() => handleVote(poll.id)}
                        >
                          {myVote ? "Update vote" : "Submit vote"}
                        </Button>
                      ) : (
                        <span className="text-xs text-text-muted">Voting closed</span>
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
