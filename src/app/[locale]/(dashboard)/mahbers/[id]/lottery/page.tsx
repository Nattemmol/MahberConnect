"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import { Trophy, Dices, Calendar, Gift, Sparkles } from "lucide-react";
import { financialService, mahberService, memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { MemberDetail, LotteryDraw } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import toast from "react-hot-toast";

export default function LotteryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawDialogOpen, setIsDrawDialogOpen] = useState(false);
  const [drawResult, setDrawResult] = useState<LotteryDraw | null>(null);

  const { data: mahber } = useQuery({
    queryKey: ["mahber", id],
    queryFn: () => mahberService.getMahberById(id),
  });

  const { data: draws, isLoading } = useQuery({
    queryKey: ["mahber-lottery", id],
    queryFn: () => financialService.getLotteryHistory(id),
  });

  const drawMutation = useMutation({
    mutationFn: () => financialService.executeLottery(id),
    onMutate: () => {
      setIsDrawing(true);
      setIsDrawDialogOpen(false);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["mahber-lottery", id],
      });
      setIsDrawing(false);
      setDrawResult(data);
      toast.success("Draw completed successfully!");
    },
    onError: (err: any) => {
      setIsDrawing(false);
      toast.error(err.message || "Failed to execute draw");
    },
  });

  const { user } = useAuthStore();
  const { data: membersResponse } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100),
  });

  const myMembership = membersResponse?.data?.find(m => m.user?.id === user?.id);
  const roleName = typeof myMembership?.role === 'string'
    ? myMembership.role
    : (myMembership?.role as any)?.name;

  const canDrawLottery = roleName === "ADMIN" ||
                         roleName === "Admin" ||
                         roleName === "Treasurer" ||
                         roleName === "TREASURER" ||
                         roleName === "Secretary" ||
                         roleName === "SECRETARY" ||
                         (myMembership?.role as any)?.permissions?.includes("manage_members") ||
                         (myMembership?.role as any)?.permissions?.includes("manage_finances");

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Equb Lottery Draw"
        description="View the history of past winners and participate in the community draw."
      />

      {canDrawLottery && (
        <Card className="border-gold/30 bg-gradient-to-br from-background-dark via-background-dark to-gold/10 relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Dices className="w-48 h-48 text-gold" />
          </div>
          <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-bold text-text-primary">
                Next Cycle Draw
              </h2>
              <p className="text-text-secondary max-w-md">
                Initiate the random selection algorithm to determine the winner of
                the current Equb cycle. Only eligible members will be included.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full md:w-auto h-16 px-8 text-lg gap-3 font-bold bg-gold text-background-dark hover:bg-gold/90 shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all transform hover:scale-105"
              onClick={() => setIsDrawDialogOpen(true)}
              disabled={isDrawing}
            >
              {isDrawing ? (
                <>
                  <Dices className="w-6 h-6 animate-spin" />
                  Drawing...
                </>
              ) : (
                <>
                  <Trophy className="w-6 h-6" />
                  Start Draw
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {!canDrawLottery && (
        <Card className="bg-surface-active/30 border-border-glass">
          <CardContent className="p-8 text-center space-y-2">
             <Trophy className="w-12 h-12 text-gold mx-auto mb-2 opacity-50" />
             <h3 className="text-lg font-bold">Draw Participation</h3>
             <p className="text-text-secondary max-w-md mx-auto">
               The lottery draws are executed by group administrators. 
               Once a draw is completed, you will see the winner in the history below.
             </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-text-primary">
          <Calendar className="w-5 h-5 text-gold" />
          Draw History
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-card" />
            ))}
          </div>
        ) : !draws || draws.length === 0 ? (
          <div className="text-center py-12 glass rounded-card">
            <Gift className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-text-secondary">
              No lottery draws have been executed yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {draws.map((draw) => {
              return (
                <Card
                  key={draw.id}
                  className="hover:border-border-glass transition-all overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center p-4 sm:p-6 gap-4 sm:gap-6">
                      <div className="shrink-0 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-active text-gold border border-gold/20">
                        <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg sm:text-xl font-bold text-text-primary truncate">
                          {draw.winner?.name || "Winner Drawn"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(draw.created_at || (draw as any).createdAt || new Date()).toLocaleDateString()}
                          </span>
                          {(draw.cycle_number || (draw as any).cycleNumber) && (
                             <span className="text-text-muted">
                               Cycle {draw.cycle_number || (draw as any).cycleNumber}
                             </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm text-text-secondary mb-1">
                          Payout
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-text-primary">
                          {(draw.payout_amount ?? (draw as any).payoutAmount ?? 0).toLocaleString()}{" "}
                          <span className="text-sm font-normal text-text-muted">
                            ETB
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 py-2 bg-surface-active/30 border-t border-border-glass/50 flex items-center justify-between text-[10px] text-text-muted uppercase tracking-widest">
                       <span>Seed: {draw.random_seed.slice(0, 16)}...</span>
                       <span>Eligible: {draw.eligible_members?.length || 0} Members</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Draw Configuration Dialog */}
      <Dialog
        isOpen={isDrawDialogOpen}
        onClose={() => setIsDrawDialogOpen(false)}
        title="Execute Lottery Draw"
        description="This will execute the draw using the Equb configuration saved at creation."
      >
        <div className="space-y-6 pt-4">
          <p className="text-sm text-text-secondary">
            The draw will only run when all active members have paid this round&apos;s contribution. The winner will receive the payout automatically.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsDrawDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-gold hover:bg-gold-dark text-black font-bold"
              onClick={() => drawMutation.mutate()}
            >
              Execute Draw
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Winner Result Dialog */}
      <Dialog
        isOpen={!!drawResult}
        onClose={() => setDrawResult(null)}
        title="🎉 Draw Completed!"
        description="The lottery has been executed successfully."
      >
        <div className="py-8 flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center text-gold relative">
            <Trophy className="w-12 h-12" />
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 animate-bounce" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-text-primary">
              {drawResult?.winner?.name || "Winner Selected"}
            </h3>
            <p className="text-text-secondary">Has won the current cycle!</p>
          </div>
          <div className="bg-surface-active/50 rounded-lg p-6 w-full border border-border-glass">
            <p className="text-sm text-text-muted uppercase tracking-widest mb-1">Total Payout</p>
            <p className="text-3xl font-bold text-gold">
              {(drawResult?.payout_amount ?? (drawResult as any)?.payoutAmount ?? 0).toLocaleString()} ETB
            </p>
          </div>
          <Button 
            className="w-full mt-4" 
            onClick={() => setDrawResult(null)}
          >
            Wonderful!
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
