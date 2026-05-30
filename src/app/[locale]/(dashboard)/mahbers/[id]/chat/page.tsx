"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState, useRef, useEffect, useMemo } from "react";
import { Send, User as UserIcon, Megaphone, BarChart3, Plus, X, Check, CheckCheck, Loader2 } from "lucide-react";
import { communicationService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ChatMessage, Announcement, Poll, ReadReceipt } from "@/lib/types";
import toast from "react-hot-toast";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { socketService } from "@/lib/socket";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [newMessage, setNewMessage] = useState("");
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  
  // Announcement state
  const [announcement, setAnnouncement] = useState({ title: "", content: "", priority: "Normal" as any });
  
  // Poll state
  const [poll, setPoll] = useState({ 
    question: "", 
    options: ["", ""], 
    poll_type: "SINGLE_CHOICE" as any, 
    voting_deadline: "" 
  });

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?.id || "usr_3";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read receipts list modal state
  const [activeReceiptsMessageId, setActiveReceiptsMessageId] = useState<string | null>(null);
  const isReceiptsDialogOpen = !!activeReceiptsMessageId;

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pendingReadIdsRef = useRef<Set<string>>(new Set());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: messagesResponse, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["mahber-chat", id],
    queryFn: () => communicationService.getChatMessages(id),
  });

  const { data: readReceipts, isLoading: isLoadingReceipts } = useQuery({
    queryKey: ["read-receipts", id, activeReceiptsMessageId],
    queryFn: () => communicationService.getReadReceipts(id, activeReceiptsMessageId!),
    enabled: !!activeReceiptsMessageId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageIds: string[]) => communicationService.markMessagesAsRead(id, messageIds),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["mahber-chat", id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m: ChatMessage) => {
            if (variables.includes(m.id)) {
              return {
                ...m,
                is_read_by_me: true,
                read_by_count: m.is_read_by_me ? m.read_by_count : m.read_by_count + 1,
              };
            }
            return m;
          }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["chat-unread", id] });
    },
  });

  const { data: announcementsResponse, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["mahber-announcements", id],
    queryFn: () => communicationService.getAnnouncements(id),
  });

  const { data: pollsResponse, isLoading: isLoadingPolls } = useQuery({
    queryKey: ["mahber-polls", id],
    queryFn: () => communicationService.getPolls(id),
  });

  const [pollSelection, setPollSelection] = useState<Record<string, string[]>>({});
  const [pollClosedByError, setPollClosedByError] = useState<Record<string, boolean>>({});

  const isLoading = isLoadingMessages || isLoadingAnnouncements || isLoadingPolls;

  const unifiedMessages = useMemo(() => {
    const msgs = (messagesResponse?.data || []).map(m => ({ ...m, type: 'message' as const }));
    const anns = (announcementsResponse?.data || []).map(a => ({ ...a, type: 'announcement' as const }));
    const polls = (pollsResponse?.data || []).map(p => ({ ...p, type: 'poll' as const }));

    return [...msgs, ...anns, ...polls].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messagesResponse?.data, announcementsResponse?.data, pollsResponse?.data]);

  const sendMutation = useMutation<ChatMessage, Error, string>({
    mutationFn: async (content: string) =>
      communicationService.sendChatMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-chat", id] });
      setNewMessage("");
    },
    onError: () => toast.error("Failed to send message"),
  });

  const voteMutation = useMutation<any, any, { pollId: string; choices: string[] }>({
    mutationFn: async ({ pollId, choices }) => communicationService.voteUpsert(id, pollId, choices),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mahber-polls", id] });
      toast.success("Vote saved");
    },
    onError: (err: any, variables) => {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save vote";
      toast.error(String(message));
      if (String(message).toLowerCase().includes("closed")) {
        setPollClosedByError((prev) => ({ ...prev, [variables.pollId]: true }));
      }
    },
  });

  useEffect(() => {
    const polls = pollsResponse?.data || [];
    if (!polls.length) return;
    setPollSelection((prev) => {
      const next = { ...prev };
      for (const p of polls) {
        if (next[p.id]?.length) continue;
        const myVote = p.votes?.find((v: any) => String(v.member_id) === String(currentUserId));
        if (myVote?.choices?.length) next[p.id] = [...myVote.choices];
      }
      return next;
    });
  }, [pollsResponse?.data, currentUserId]);

  const announceMutation = useMutation<Announcement, Error, any>({
    mutationFn: async (data: any) => communicationService.createAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-announcements", id] });
      setIsAnnouncementDialogOpen(false);
      setAnnouncement({ title: "", content: "", priority: "Normal" });
      toast.success("Announcement broadcasted!");
    },
    onError: () => toast.error("Failed to send announcement"),
  });

  const pollMutation = useMutation<Poll, Error, any>({
    mutationFn: async (data: any) => {
      // Map options to the format expected by the backend: { id, text }[]
      const formattedOptions = data.options.map((opt: string, index: number) => ({
        id: `opt_${index + 1}`, // Backend requires an ID
        text: opt
      }));
      
      return communicationService.createPoll(id, {
        ...data,
        options: formattedOptions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-polls", id] });
      setIsPollDialogOpen(false);
      setPoll({ question: "", options: ["", ""], poll_type: "SINGLE_CHOICE", voting_deadline: "" });
      toast.success("Poll created successfully!");
    },
    onError: () => toast.error("Failed to create poll"),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [unifiedMessages]);

  useEffect(() => {
    if (isLoadingMessages || !messagesResponse?.data) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let hasNewIds = false;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgId = entry.target.getAttribute("data-message-id");
            const isUnread = entry.target.getAttribute("data-unread") === "true";
            const senderId = entry.target.getAttribute("data-sender-id");

            if (msgId && isUnread && senderId !== currentUserId) {
              pendingReadIdsRef.current.add(msgId);
              hasNewIds = true;
            }
          }
        });

        if (hasNewIds) {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }

          debounceTimeoutRef.current = setTimeout(() => {
            const idsToMark = Array.from(pendingReadIdsRef.current);
            if (idsToMark.length > 0) {
              markAsReadMutation.mutate(idsToMark);
              pendingReadIdsRef.current.clear();
            }
          }, 500);
        }
      },
      {
        root: chatContainerRef.current,
        threshold: 0.1,
      }
    );

    const elements = document.querySelectorAll("[data-message-id]");
    elements.forEach((el) => {
      const isUnread = el.getAttribute("data-unread") === "true";
      const senderId = el.getAttribute("data-sender-id");
      if (isUnread && senderId !== currentUserId) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [messagesResponse?.data, currentUserId, isLoadingMessages]);

  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket) {
      socketService.joinMahberRoom(id);

      const handleNewMessage = (message: any) => {
        queryClient.setQueryData(["mahber-chat", id], (old: any) => {
          if (!old) return old;
          if (old.data.some((m: any) => m.id === message.id)) return old;
          return {
            ...old,
            data: [...old.data, message]
          };
        });
      };

      const handleMessagesRead = (payload: { reader_id: string; message_ids: string[]; read_at: string }) => {
        queryClient.setQueryData(["mahber-chat", id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((m: any) => {
              if (payload.message_ids.includes(m.id)) {
                const isReaderMe = payload.reader_id === currentUserId;
                const wasReadByMe = m.is_read_by_me;
                return {
                  ...m,
                  is_read_by_me: isReaderMe ? true : m.is_read_by_me,
                  read_by_count: isReaderMe 
                    ? (wasReadByMe ? m.read_by_count : m.read_by_count + 1)
                    : m.read_by_count + 1,
                };
              }
              return m;
            }),
          };
        });
        queryClient.invalidateQueries({ queryKey: ["chat-unread", id] });
      };

      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
      socket.on('new_announcement', () => queryClient.invalidateQueries({ queryKey: ["mahber-announcements", id] }));
      socket.on('new_poll', () => queryClient.invalidateQueries({ queryKey: ["mahber-polls", id] }));

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
        socket.off('new_announcement');
        socket.off('new_poll');
        socketService.leaveMahberRoom(id);
      };
    }
  }, [id, queryClient, currentUserId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  const handlePollOptionClick = (pollId: string, optionId: string, pollType: string) => {
    const current = pollSelection[pollId] || [];
    if (pollType === 'SINGLE_CHOICE') {
      setPollSelection({ ...pollSelection, [pollId]: [optionId] });
    } else if (pollType === 'RANKED_CHOICE') {
      if (current.includes(optionId)) {
        setPollSelection({ ...pollSelection, [pollId]: current.filter(id => id !== optionId) });
      } else {
        setPollSelection({ ...pollSelection, [pollId]: [...current, optionId] });
      }
    } else {
      if (current.includes(optionId)) {
        setPollSelection({ ...pollSelection, [pollId]: current.filter(id => id !== optionId) });
      } else {
        setPollSelection({ ...pollSelection, [pollId]: [...current, optionId] });
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <PageHeader
        title="Group Chat"
        description="Communicate with other members of the Mahber."
      />

      <div className="flex-1 glass rounded-card overflow-hidden flex flex-col border border-border-glass relative">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4 max-w-sm rounded-r-2xl rounded-bl-2xl" />
              <Skeleton className="h-16 w-3/4 max-w-sm rounded-l-2xl rounded-br-2xl ml-auto" />
            </div>
          ) : !unifiedMessages.length ? (
            <div className="h-full flex items-center justify-center text-text-secondary">
              No activity yet. Start the conversation!
            </div>
          ) : (
            unifiedMessages.map((item: any) => {
              if (item.type === 'message') {
                const isMine = item.sender_id === currentUserId;
                return (
                  <div
                    key={item.id}
                    data-message-id={item.id}
                    data-unread={!item.is_read_by_me}
                    data-sender-id={item.sender_id}
                    className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {!isMine && (
                      <Avatar className="w-8 h-8 shrink-0 mb-1 border border-border-glass">
                        <UserIcon className="w-4 h-4" />
                      </Avatar>
                    )}
                    <div
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%]`}
                    >
                      {!isMine && (
                        <span className="text-xs text-text-muted ml-2 mb-1">
                          {item.sender?.name}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2 text-sm shadow-sm ${
                          isMine
                            ? "bg-gold text-background-dark rounded-l-2xl rounded-tr-2xl"
                            : "bg-surface-active text-text-primary rounded-r-2xl rounded-tl-2xl border border-border-glass"
                        }`}
                      >
                        {item.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1 mx-1">
                        <span className="text-[10px] text-text-muted">
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMine && (
                          <span className="shrink-0">
                            {item.id.startsWith("temp_") ? (
                              <Check className="w-3 h-3 text-text-muted" />
                            ) : item.read_by_count > 0 ? (
                              <CheckCheck className="w-3 h-3 text-sky-400" />
                            ) : (
                              <CheckCheck className="w-3 h-3 text-text-muted" />
                            )}
                          </span>
                        )}
                      </div>
                      {isMine && item.read_by_count > 0 && (
                        <button
                          onClick={() => setActiveReceiptsMessageId(item.id)}
                          className="text-[10px] text-gold hover:underline mt-0.5 mx-1 transition-colors"
                        >
                          Read by {item.read_by_count}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (item.type === 'announcement') {
                return (
                  <div key={item.id} className="flex justify-center my-4">
                    <div className="max-w-[85%] w-full bg-gold/5 border border-gold/20 rounded-card p-4 space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Megaphone className="w-12 h-12" />
                      </div>
                      <div className="flex items-center gap-2 text-gold">
                        <Megaphone className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Announcement</span>
                        <Badge variant="outline" className="text-[10px] border-gold/30 text-gold ml-auto">
                          {item.priority}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-text-primary">{item.title}</h4>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{item.content}</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-text-muted">By {item.creator?.name || "Admin"}</span>
                        <span className="text-[10px] text-text-muted">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (item.type === 'poll') {
                const votes = item.votes || [];
                const hasVoted = votes.some((v: any) => String(v.member_id) === String(currentUserId));
                const selection = pollSelection[item.id] || [];
                const now = Date.now();
                const deadlineMs = item.voting_deadline ? new Date(item.voting_deadline).getTime() : 0;
                const isClosed =
                  Boolean(pollClosedByError[item.id]) ||
                  Boolean(item.is_closed) ||
                  (deadlineMs !== 0 && deadlineMs <= now);
                const canEdit = !isClosed;
                const myVote = votes.find((v: any) => String(v.member_id) === String(currentUserId));
                
                return (
                  <div key={item.id} className="flex justify-center my-4">
                    <div className="max-w-[85%] w-full bg-surface-active border border-border-glass rounded-card p-4 space-y-4 shadow-xl">
                      <div className="flex items-center gap-2 text-status-success">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Poll</span>
                        {item.poll_type === 'RANKED_CHOICE' && (
                          <Badge variant="outline" className="text-[10px] border-status-success/30 text-status-success">Ranked</Badge>
                        )}
                        {isClosed && <Badge className="ml-auto bg-text-muted">Closed</Badge>}
                      </div>
                      <h4 className="font-bold text-text-primary text-lg">{item.question}</h4>
                      <div className="space-y-2">
                        {item.options.map((opt: any) => {
                          const isSelected = selection.includes(opt.id);
                          const votedForThis = myVote?.choices?.includes(opt.id);
                          const rankIndex = item.poll_type === 'RANKED_CHOICE' ? selection.indexOf(opt.id) : -1;
                          
                          return (
                            <button
                              key={opt.id}
                              disabled={!canEdit}
                              onClick={() => handlePollOptionClick(item.id, opt.id, item.poll_type)}
                              className={`w-full text-left p-3 rounded-button border transition-all group ${
                                !canEdit
                                  ? "border-border-glass opacity-70 cursor-not-allowed"
                                  : isSelected
                                  ? "border-gold bg-gold/10"
                                  : "border-border-glass hover:border-gold/50"
                              }`}
                            >
                              <div className="flex justify-between items-center gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {item.poll_type === 'RANKED_CHOICE' && isSelected && (
                                    <span className="w-6 h-6 rounded-full bg-gold text-background-dark text-xs font-bold flex items-center justify-center shrink-0">
                                      {rankIndex + 1}
                                    </span>
                                  )}
                                  <span className="text-sm font-medium truncate">{opt.text}</span>
                                </div>
                                {hasVoted && votedForThis && (
                                  <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] shrink-0">Your Vote</Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-4">
                        <Button 
                          className="w-full"
                          variant={hasVoted ? "outline" : "default"}
                          disabled={!canEdit || selection.length === 0 || voteMutation.isPending}
                          isLoading={voteMutation.isPending}
                          onClick={() => voteMutation.mutate({ pollId: item.id, choices: selection })}
                        >
                          {!canEdit ? "Voting closed" : hasVoted ? "Update vote" : "Submit vote"}
                        </Button>

                        {(hasVoted || isClosed) && item.poll_type === 'RANKED_CHOICE' ? (
                          <div className="pt-2 border-t border-border-glass space-y-3">
                            <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider">Results (Ranked Choice)</h5>
                            {item.votes?.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-[11px] text-text-muted">
                                  {item.votes.length} total votes
                                </div>
                                {item.options.map((opt: any) => {
                                  const voteCount = votes.filter((v: any) => v.choices?.includes(opt.id)).length || 0;
                                  const rankedVoters = votes.filter((v: any) => v.choices?.[0] === opt.id).length;
                                  return (
                                    <div key={opt.id} className="space-y-1">
                                      <div className="flex justify-between text-[11px] font-medium">
                                        <span>{opt.text}</span>
                                        <span>{rankedVoters} first-pref</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-background-dark rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gold transition-all duration-1000" 
                                          style={{ width: `${(rankedVoters / (item.votes.length || 1)) * 100}%` }} 
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[11px] text-text-muted">No votes yet</div>
                            )}
                          </div>
                        ) : (hasVoted || isClosed) ? (
                          <div className="pt-2 border-t border-border-glass space-y-3">
                            <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider">Current Results</h5>
                            {item.options.map((opt: any) => {
                              const voteCount = votes.filter((v: any) => v.choices?.includes(opt.id)).length || 0;
                              const totalVotes = votes.length || 1;
                              const percentage = Math.round((voteCount / totalVotes) * 100);
                              
                              return (
                                <div key={opt.id} className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-medium">
                                    <span>{opt.text}</span>
                                    <span>{voteCount} votes ({percentage}%)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-background-dark rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gold transition-all duration-1000" 
                                      style={{ width: `${percentage}%` }} 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-text-muted">{votes.length} votes • Created by {item.creator?.name || "Admin"}</span>
                        <span className="text-[10px] text-text-muted">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-background-dark/80 border-t border-border-glass backdrop-blur-md">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-surface-active border-border-glass focus:border-gold/50 transition-colors"
              disabled={sendMutation.isPending}
            />
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-border-glass text-gold hover:bg-gold/10"
                onClick={() => setIsAnnouncementDialogOpen(true)}
              >
                <Megaphone className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-border-glass text-status-success hover:bg-status-success/10"
                onClick={() => setIsPollDialogOpen(true)}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="px-4 bg-gold hover:bg-gold/90 text-background-dark font-bold"
                isLoading={sendMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Announcement Dialog */}
      <Dialog
        isOpen={isAnnouncementDialogOpen}
        onClose={() => setIsAnnouncementDialogOpen(false)}
        title="Create Announcement"
        description="Broadcast an important message to all members."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              placeholder="Announcement title" 
              value={announcement.title}
              onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <select 
              className="w-full bg-surface-active border border-border-glass rounded-input p-2 text-sm focus:outline-none focus:border-gold/50"
              value={announcement.priority}
              onChange={(e) => setAnnouncement({...announcement, priority: e.target.value})}
            >
              <option value="Normal">Normal</option>
              <option value="Important">Important</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <textarea 
              className="w-full h-32 bg-surface-active border border-border-glass rounded-input p-3 text-sm focus:outline-none focus:border-gold/50"
              placeholder="Enter your message here..."
              value={announcement.content}
              onChange={(e) => setAnnouncement({...announcement, content: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsAnnouncementDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => announceMutation.mutate(announcement)}
              isLoading={announceMutation.isPending}
              disabled={!announcement.title || !announcement.content}
            >
              Broadcast
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Poll Dialog */}
      <Dialog
        isOpen={isPollDialogOpen}
        onClose={() => setIsPollDialogOpen(false)}
        title="Create Poll"
        description="Gather feedback from members with a poll."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Question</label>
            <Input 
              placeholder="What would you like to ask?" 
              value={poll.question}
              onChange={(e) => setPoll({...poll, question: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Poll Type</label>
            <select 
              className="w-full bg-surface-active border border-border-glass rounded-input p-2 text-sm focus:outline-none focus:border-gold/50"
              value={poll.poll_type}
              onChange={(e) => setPoll({...poll, poll_type: e.target.value})}
            >
              <option value="SINGLE_CHOICE">Single Choice</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="RANKED_CHOICE">Ranked Choice</option>
            </select>
            {poll.poll_type === 'RANKED_CHOICE' && (
              <p className="text-[11px] text-text-muted">Tap options to rank them in order of preference (1st, 2nd, 3rd, ...)</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex justify-between items-center">
              Options
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-gold px-2"
                onClick={() => setPoll({...poll, options: [...poll.options, ""]})}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Option
              </Button>
            </label>
            <div className="space-y-2">
              {poll.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...poll.options];
                      newOpts[i] = e.target.value;
                      setPoll({...poll, options: newOpts});
                    }}
                  />
                  {poll.options.length > 2 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setPoll({...poll, options: poll.options.filter((_, idx) => idx !== i)})}
                    >
                      <X className="w-4 h-4 text-status-error" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsPollDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => pollMutation.mutate({
                ...poll,
                voting_deadline: new Date(Date.now() + 86400000).toISOString() // Default 24h
              })}
              isLoading={pollMutation.isPending}
              disabled={!poll.question || poll.options.some(o => !o.trim())}
            >
              Create Poll
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Read Receipts Dialog */}
      <Dialog
        isOpen={isReceiptsDialogOpen}
        onClose={() => setActiveReceiptsMessageId(null)}
        title="Message Read Receipts"
        description="See who has read this message and when."
      >
        <div className="space-y-4 pt-2">
          {isLoadingReceipts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
          ) : !readReceipts || readReceipts.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              No read receipts yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {readReceipts.map((receipt: ReadReceipt) => (
                <div key={receipt.member_id} className="flex items-center justify-between p-2 rounded-lg bg-surface-active/50 border border-border-glass">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 border border-border-glass flex items-center justify-center bg-background-dark">
                      <UserIcon className="w-3 h-3 text-text-secondary" />
                    </Avatar>
                    <span className="text-sm font-medium text-text-primary">
                      {receipt.member_name}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(receipt.read_at).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setActiveReceiptsMessageId(null)}>Close</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
