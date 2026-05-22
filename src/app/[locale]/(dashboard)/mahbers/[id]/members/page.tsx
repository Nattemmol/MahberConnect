"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import {
  MoreVertical,
  Search,
  UserMinus,
  UserCheck,
  ShieldAlert,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import { memberService, mahberService, authService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { MemberDetail, RoleName, User } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslations } from "next-intl";

export default function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const t = useTranslations("Members");

  // Invite states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [searchUserLoading, setSearchUserLoading] = useState(false);
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const { data: mahber } = useQuery({
    queryKey: ["mahber-details", id],
    queryFn: () => mahberService.getMahberById(id),
  });

  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ["mahber-members", id],
    queryFn: () => memberService.getMembers(id),
  });

  const { data: joinRequests } = useQuery({
    queryKey: ["mahber-join-requests", id],
    queryFn: () => memberService.getJoinRequests(id),
  });

  const myMembership = membersResponse?.data?.find((m) => m.user?.id === user?.id);
  const isAdmin =
    (myMembership?.role as any) === "ADMIN" ||
    (myMembership?.role as any) === "Admin" ||
    (myMembership?.role as any)?.name === "Admin" ||
    (myMembership?.role as any)?.name === "ADMIN" ||
    (myMembership?.role as any)?.permissions?.includes("manage_members") ||
    (myMembership?.role as any)?.permissions?.includes("manage_finances");

  const suspendMutation = useMutation({
    mutationFn: (memberId: string) => memberService.suspendMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-members", id] });
      toast.success("Member suspended successfully");
    },
    onError: () => toast.error("Failed to suspend member"),
  });

  const reinstateMutation = useMutation({
    mutationFn: (memberId: string) =>
      memberService.reinstateMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-members", id] });
      toast.success("Member reinstated successfully");
    },
    onError: () => toast.error("Failed to reinstate member"),
  });

  const unbanMutation = useMutation({
    mutationFn: (memberId: string) =>
      memberService.unbanMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-members", id] });
      toast.success("Member successfully unbanned.");
      setUnbanTarget(null);
    },
    onError: () => toast.error("Failed to unban member"),
  });

  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<MemberDetail | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const roleMutation = useMutation({
    mutationFn: (data: { memberId: string; role_name: RoleName }) =>
      memberService.updateMemberRole(id, data.memberId, { role_name: data.role_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-members", id] });
      toast.success("Role updated successfully");
      setIsRoleDialogOpen(false);
    },
    onError: () => toast.error("Failed to update role"),
  });

  const handleSearchUser = async () => {
    setSearchUserLoading(true);
    setSearchedUser(null);
    try {
      // Normalize phone number to international format (+251...)
      const cleanedPhone = invitePhone.trim().replace(/\s+/g, "");
      const formattedPhone = cleanedPhone.startsWith("0")
        ? `+251${cleanedPhone.slice(1)}`
        : cleanedPhone;

      const data = await authService.searchUserByPhone(formattedPhone);
      setSearchedUser(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("userNotFound"));
    } finally {
      setSearchUserLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!searchedUser) return;

    // Check if user is already a member
    const isAlreadyMember = membersResponse?.data?.some(
      (m) => m.user?.id === searchedUser.id || m.user?.phone === searchedUser.phone
    );
    if (isAlreadyMember) {
      toast.error("User already in Mahber");
      setSearchedUser(null);
      setInvitePhone("");
      setIsInviteDialogOpen(false);
      return;
    }

    // Check if user is already invited
    const isAlreadyInvited = joinRequests?.some(
      (r) => r.user?.id === searchedUser.id || r.user?.phone === searchedUser.phone
    );
    if (isAlreadyInvited) {
      toast.error("User is already invited");
      setSearchedUser(null);
      setInvitePhone("");
      setIsInviteDialogOpen(false);
      return;
    }

    setInviteLoading(true);
    try {
      await mahberService.inviteMember(id, searchedUser.phone);
      toast.success(t("inviteSuccess"));
      setIsInviteDialogOpen(false);
      setInvitePhone("");
      setSearchedUser(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("inviteError"));
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredMembers = (membersResponse?.data || []).filter(
    (m) =>
      m.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.phone.includes(search),
  );

  const getRoleLabel = (roleName: unknown, roleFallback: unknown) => {
    if (typeof roleName === "string") return roleName;
    if (
      roleName &&
      typeof roleName === "object" &&
      "name" in roleName &&
      typeof (roleName as { name?: unknown }).name === "string"
    ) {
      return (roleName as { name: string }).name;
    }
    if (typeof roleFallback === "string") return roleFallback;
    if (
      roleFallback &&
      typeof roleFallback === "object" &&
      "name" in roleFallback &&
      typeof (roleFallback as { name?: unknown }).name === "string"
    ) {
      return (roleFallback as { name: string }).name;
    }
    return "Member";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      >
        <div className="flex gap-2">
          {isAdmin && mahber && !mahber.is_public && (
            <Button
              onClick={() => setIsInviteDialogOpen(true)}
              className="bg-gold hover:bg-gold-dark text-black gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {t("addMember")}
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/mahbers/${id}/join-requests`}>Join Requests</Link>
          </Button>
        </div>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Search members by name or phone..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filteredMembers?.length === 0 ? (
        <div className="text-center py-12 glass rounded-card">
          <p className="text-text-secondary">
            No members found matching your search.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Link
                    href={`/mahbers/${id}/members/${member.id}`}
                    className="flex items-center gap-3 hover:text-gold transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <UserIcon className="w-4 h-4" />
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user?.name}</p>
                      <p className="text-xs text-text-secondary">
                        {member.user?.phone}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getRoleLabel(member.role_name, member.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      member.status === "Active"
                        ? "success"
                        : member.status === "Suspended" || member.status === "Banned"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-text-secondary">
                  {new Date(member.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {member.status === "Banned" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnbanTarget(member)}
                      className="border-gold/50 text-gold hover:bg-gold/10"
                    >
                      <UserCheck className="w-4 h-4 mr-1.5" />
                      Unban
                    </Button>
                  ) : (
                    <DropdownMenu
                      trigger={
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    >
                      <DropdownMenuItem onClick={() => {
                        setSelectedMember(member);
                        setIsRoleDialogOpen(true);
                      }}>
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      {member.status === "Active" ? (
                        <DropdownMenuItem
                          onClick={() => suspendMutation.mutate(member.id)}
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            reinstateMutation.mutate(member.id)
                          }
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Reinstate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pending Invitations Section */}
      {isAdmin && joinRequests && joinRequests.filter(r => r.is_invitation && r.status === "Pending").length > 0 && (
        <div className="space-y-4 pt-6 mt-6 border-t border-border">
          <h2 className="text-xl font-semibold text-text-primary">Pending Invitations</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invited User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {joinRequests.filter(r => r.is_invitation && r.status === "Pending").map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.user?.name}</TableCell>
                  <TableCell className="text-text-secondary">{req.user?.phone}</TableCell>
                  <TableCell>
                    <Badge variant="warning">{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {new Date(req.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Role Selection Dialog */}
      <Dialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        title="Change Member Role"
        description={`Assign a new role to ${selectedMember?.user?.name}. This will update their permissions within the Mahber.`}
      >
        <div className="grid gap-3 py-4">
          {(["Admin", "Treasurer", "Secretary", "Member"] as RoleName[]).map((role) => (
            <button
              key={role}
              onClick={() => {
                if (selectedMember) {
                  roleMutation.mutate({ memberId: selectedMember.id, role_name: role });
                }
              }}
              disabled={roleMutation.isPending}
              className="flex items-center justify-between p-4 rounded-lg bg-surface-active/50 border border-border-glass hover:border-gold/50 transition-all text-left"
            >
              <div>
                <p className="font-bold">{role}</p>
                <p className="text-xs text-text-muted">
                  {role === "Admin" && "Full control over all Mahber features."}
                  {role === "Treasurer" && "Manage finances and view reports."}
                  {role === "Secretary" && "Manage events and announcements."}
                  {role === "Member" && "Standard participation permissions."}
                </p>
              </div>
              {roleMutation.isPending && <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold border-t-transparent" />}
            </button>
          ))}
        </div>
      </Dialog>

      {/* Unban Confirmation Dialog */}
      <Dialog
        isOpen={!!unbanTarget}
        onClose={() => setUnbanTarget(null)}
        title="Confirm Unban Member"
        description={`Are you sure you want to unban ${unbanTarget?.user?.name}? This will restore their active status in the Mahber.`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => setUnbanTarget(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (unbanTarget) {
                unbanMutation.mutate(unbanTarget.id);
              }
            }}
            isLoading={unbanMutation.isPending}
            className="bg-gold hover:bg-gold-dark text-black font-semibold"
          >
            Confirm Unban
          </Button>
        </div>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog
        isOpen={isInviteDialogOpen}
        onClose={() => {
          setIsInviteDialogOpen(false);
          setInvitePhone("");
          setSearchedUser(null);
        }}
        title={t("inviteTitle")}
        description={t("inviteDescription")}
      >
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("phonePlaceholder")}
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              disabled={searchUserLoading || inviteLoading}
            />
            <Button
              onClick={handleSearchUser}
              disabled={!invitePhone || searchUserLoading || inviteLoading}
              className="bg-gold hover:bg-gold-dark text-black shrink-0"
            >
              {searchUserLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
              ) : (
                t("search")
              )}
            </Button>
          </div>

          {searchedUser && (
            <div className="p-4 rounded-lg bg-surface-active/50 border border-border-glass flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">{searchedUser.name}</p>
                <p className="text-xs text-text-muted">{searchedUser.phone}</p>
              </div>
              <Button
                onClick={handleSendInvite}
                disabled={inviteLoading}
                className="bg-gold hover:bg-gold-dark text-black"
              >
                {inviteLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                ) : (
                  t("invite")
                )}
              </Button>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
