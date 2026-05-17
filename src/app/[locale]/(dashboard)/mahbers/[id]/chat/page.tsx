"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState, useRef, useEffect, useMemo } from "react";
import { Send, User as UserIcon, Megaphone, BarChart3, Plus, X } from "lucide-react";
import { communicationService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ChatMessage, Announcement, Poll } from "@/lib/types";
import toast from "react-hot-toast";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesResponse, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["mahber-chat", id],
    queryFn: () => communicationService.getChatMessages(id),
    refetchInterval: 5000,
  });

  const { data: announcementsResponse, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["mahber-announcements", id],
    queryFn: () => communicationService.getAnnouncements(id),
    refetchInterval: 10000,
  });

  const { data: pollsResponse, isLoading: isLoadingPolls } = useQuery({
    queryKey: ["mahber-polls", id],
    queryFn: () => communicationService.getPolls(id),
    refetchInterval: 10000,
  });

  const [pollSelection, setPollSelection] = useState<Record<string, string[]>>({});

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

  const voteMutation = useMutation<any, Error, { pollId: string; choices: string[] }>({
    mutationFn: async ({ pollId, choices }) => communicationService.vote(id, pollId, choices),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mahber-polls", id] });
      setPollSelection(prev => {
        const next = { ...prev };
        delete next[variables.pollId];
        return next;
      });
      toast.success("Vote recorded!");
    },
    onError: () => toast.error("Failed to record vote"),
  });

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
    } else {
      if (current.includes(optionId)) {
        setPollSelection({ ...pollSelection, [pollId]: current.filter(id => id !== optionId) });
      } else {
        setPollSelection({ ...pollSelection, [pollId]: [...current, optionId] });
      }
    }
  };

  const currentUserId = user?.id || "usr_3";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <PageHeader
        title="Group Chat"
        description="Communicate with other members of the Mahber."
      />

      <div className="flex-1 glass rounded-card overflow-hidden flex flex-col border border-border-glass relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                      <span className="text-[10px] text-text-muted mt-1 mx-1">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
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
                
                return (
                  <div key={item.id} className="flex justify-center my-4">
                    <div className="max-w-[85%] w-full bg-surface-active border border-border-glass rounded-card p-4 space-y-4 shadow-xl">
                      <div className="flex items-center gap-2 text-status-success">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Poll</span>
                        {item.is_closed && <Badge className="ml-auto bg-text-muted">Closed</Badge>}
                      </div>
                      <h4 className="font-bold text-text-primary text-lg">{item.question}</h4>
                      <div className="space-y-2">
                        {item.options.map((opt: any) => {
                          const isSelected = selection.includes(opt.id);
                          const myVote = votes.find((v: any) => String(v.member_id) === String(currentUserId));
                          const votedForThis = myVote?.choices?.includes(opt.id);
                          
                          return (
                            <button
                              key={opt.id}
                              disabled={hasVoted || item.is_closed}
                              onClick={() => handlePollOptionClick(item.id, opt.id, item.poll_type)}
                              className={`w-full text-left p-3 rounded-button border transition-all group ${
                                hasVoted 
                                  ? "border-border-glass opacity-70 cursor-default" 
                                  : isSelected
                                    ? "border-gold bg-gold/10"
                                    : "border-border-glass hover:border-gold/50"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{opt.text}</span>
                                {hasVoted && votedForThis && (
                                  <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px]">Your Vote</Badge>
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
                          disabled={hasVoted || selection.length === 0 || voteMutation.isPending || item.is_closed}
                          isLoading={voteMutation.isPending}
                          onClick={() => voteMutation.mutate({ pollId: item.id, choices: selection })}
                        >
                          {hasVoted ? "Voted" : "Vote"}
                        </Button>

                        {hasVoted && (
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
                        )}
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
    </div>
  );
}
