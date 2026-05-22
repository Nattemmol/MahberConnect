"use client";

import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Compass, Users } from "lucide-react";
import { mahberService, memberService } from '@/lib/api/service-factory';
import { useQueries } from '@tanstack/react-query';
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";

export default function DiscoverMahbersPage() {
  const router = useRouter();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [joinTarget, setJoinTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [invitationCode, setInvitationCode] = useState("");

  const {
    data: mahbers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["public-mahbers"],
    queryFn: () => mahberService.getPublicMahbers(),
  });

  const { data: myMahbers } = useQuery({
    queryKey: ["mahbers"],
    queryFn: () => mahberService.getMahbers(),
  });

  const memberCountQueries = useQueries({
    queries: (mahbers ?? []).map((mahber) => ({
      queryKey: ['mahber-members-count', mahber.id],
      queryFn: () => memberService.getMembers(mahber.id, 1, 1),
      select: (data) => data.meta.total,
      enabled: !!mahbers,
    })),
  });

  const joinedIds = new Set(myMahbers?.map((m) => m.id) || []);

  const handleJoin = async () => {
    if (!joinTarget) return;

    try {
      setJoiningId(joinTarget.id);
      const response = await mahberService.joinMahberSubsystem(joinTarget.id);
      
      if (response.paymentRequired) {
        if (response.token) {
          localStorage.setItem("pending_join_token", response.token);
        }
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          toast.error("Payment URL not found.");
        }
      } else {
        toast.success("Welcome! You have successfully joined the Mahber.");
        router.push(`/mahbers/${joinTarget.id}`);
      }
      
      setJoinTarget(null);
      setInvitationCode("");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      toast.error(
        error.response?.data?.message || "Failed to join Mahber",
      );
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Discover"
        description="Find and join public communities."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48">
              <CardHeader className="gap-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mahbers?.length === 0 ? (
        <div className="text-center py-20 glass rounded-card">
          <Compass className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No Public Mahbers Found
          </h3>
          <p className="text-text-secondary">
            Check back later for new communities to join.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mahbers?.map((mahber, index) => (
            <Card
              key={mahber.id}
              className="hover:border-gold/50 transition-colors"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant={
                      mahber.type === "EQUB"
                        ? "success"
                        : mahber.type === "IDDIR"
                          ? "warning"
                          : "default"
                    }
                  >
                    {mahber.type}
                  </Badge>
                  <div className="flex items-center text-text-secondary text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    {memberCountQueries[index]?.data ?? 0}
                  </div>
                </div>
                <CardTitle>{mahber.name}</CardTitle>
                <CardDescription>
                  Created {new Date(mahber.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                {joinedIds.has(mahber.id) ? (
                  <Button
                    className="w-full bg-success/20 text-success hover:bg-success/30 border-success/30"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/mahbers/${mahber.id}`}>Joined</Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setJoinTarget({ id: mahber.id, name: mahber.name });
                      setInvitationCode("");
                    }}
                    isLoading={joiningId === mahber.id}
                    disabled={requestedIds.has(mahber.id)}
                    variant={requestedIds.has(mahber.id) ? "outline" : "default"}
                  >
                    {requestedIds.has(mahber.id) ? "Requested" : "Request to Join"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        isOpen={!!joinTarget}
        onClose={() => {
          setJoinTarget(null);
          setInvitationCode("");
        }}
        title={
          joinTarget ? `Request to Join ${joinTarget.name}` : "Request to Join"
        }
        description="Enter an invitation code if required by the community."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Invitation Code (optional for public Mahbers)
            </label>
            <Input
              placeholder="e.g., ABC123"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
            />
            <p className="text-xs text-text-muted">
              Private Mahbers require a valid invitation code.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setJoinTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              isLoading={joiningId === joinTarget?.id}
            >
              Send Request
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
