"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/stores/auth-store";
import { superAdminApi, type PaginationMeta } from "@/lib/api/services/super-admin.api";

type TabKey = "users" | "mahbers" | "payments" | "audit";

const PAGE_SIZE = 10;

export default function SuperAdminPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [search, setSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [mahbersPage, setMahbersPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedMahberId, setSelectedMahberId] = useState<string | null>(null);

  const trimmedSearch = search.trim();

  const usersQuery = useQuery({
    queryKey: ["super-admin", "users", usersPage, trimmedSearch],
    queryFn: () =>
      superAdminApi.getUsers({
        page: usersPage,
        limit: PAGE_SIZE,
        search: trimmedSearch || undefined,
      }),
    enabled: user?.is_super_admin === true,
  });

  const mahbersQuery = useQuery({
    queryKey: ["super-admin", "mahbers", mahbersPage, trimmedSearch],
    queryFn: () =>
      superAdminApi.getMahbers({
        page: mahbersPage,
        limit: PAGE_SIZE,
        search: trimmedSearch || undefined,
      }),
    enabled: user?.is_super_admin === true,
  });

  const paymentsQuery = useQuery({
    queryKey: ["super-admin", "payments", paymentsPage, trimmedSearch],
    queryFn: () =>
      superAdminApi.getPayments({
        page: paymentsPage,
        limit: PAGE_SIZE,
        search: trimmedSearch || undefined,
      }),
    enabled: user?.is_super_admin === true,
  });

  const auditQuery = useQuery({
    queryKey: ["super-admin", "audit", auditPage],
    queryFn: () =>
      superAdminApi.getAuditLogs({
        page: auditPage,
        limit: PAGE_SIZE,
      }),
    enabled: user?.is_super_admin === true,
  });

  const statsQuery = useQuery({
    queryKey: ["super-admin", "stats"],
    queryFn: () => superAdminApi.getStats(),
    enabled: user?.is_super_admin === true,
  });

  const userDetailsQuery = useQuery({
    queryKey: ["super-admin", "user-details", selectedUserId],
    queryFn: () => superAdminApi.getUserById(selectedUserId as string),
    enabled: !!selectedUserId && user?.is_super_admin === true,
  });

  const mahberDetailsQuery = useQuery({
    queryKey: ["super-admin", "mahber-details", selectedMahberId],
    queryFn: () => superAdminApi.getMahberById(selectedMahberId as string),
    enabled: !!selectedMahberId && user?.is_super_admin === true,
  });

  const invalidateMainLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["super-admin", "stats"] }),
      queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] }),
      queryClient.invalidateQueries({ queryKey: ["super-admin", "mahbers"] }),
      queryClient.invalidateQueries({ queryKey: ["super-admin", "payments"] }),
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit"] }),
    ]);
  };

  const userStatusMutation = useMutation({
    mutationFn: (params: { id: string; isSuspended: boolean }) =>
      superAdminApi.updateUserStatus(params.id, params.isSuspended),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ["super-admin", "users"] });
      const previous = queryClient.getQueryData(["super-admin", "users", usersPage, trimmedSearch]);

      queryClient.setQueryData(
        ["super-admin", "users", usersPage, trimmedSearch],
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((entry: any) =>
              entry.id === params.id ? { ...entry, is_suspended: params.isSuspended } : entry,
            ),
          };
        },
      );

      return { previous };
    },
    onError: (error: any, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["super-admin", "users", usersPage, trimmedSearch], context.previous);
      }
      toast.error(error?.response?.data?.message || "Failed to update user status");
    },
    onSuccess: () => {
      toast.success("User status updated");
    },
    onSettled: invalidateMainLists,
  });

  const userSuperAdminMutation = useMutation({
    mutationFn: (params: { id: string; isSuperAdmin: boolean }) =>
      superAdminApi.updateUserSuperAdmin(params.id, params.isSuperAdmin),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ["super-admin", "users"] });
      const previous = queryClient.getQueryData(["super-admin", "users", usersPage, trimmedSearch]);

      queryClient.setQueryData(
        ["super-admin", "users", usersPage, trimmedSearch],
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((entry: any) =>
              entry.id === params.id ? { ...entry, is_super_admin: params.isSuperAdmin } : entry,
            ),
          };
        },
      );

      return { previous };
    },
    onError: (error: any, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["super-admin", "users", usersPage, trimmedSearch], context.previous);
      }
      toast.error(error?.response?.data?.message || "Failed to update super admin role");
    },
    onSuccess: () => {
      toast.success("Super admin role updated");
    },
    onSettled: invalidateMainLists,
  });

  const mahberStatusMutation = useMutation({
    mutationFn: (params: { id: string; isSuspended: boolean }) =>
      superAdminApi.updateMahberStatus(params.id, params.isSuspended),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ["super-admin", "mahbers"] });
      const previous = queryClient.getQueryData(["super-admin", "mahbers", mahbersPage, trimmedSearch]);

      queryClient.setQueryData(
        ["super-admin", "mahbers", mahbersPage, trimmedSearch],
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((entry: any) =>
              entry.id === params.id ? { ...entry, is_suspended: params.isSuspended } : entry,
            ),
          };
        },
      );

      return { previous };
    },
    onError: (error: any, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["super-admin", "mahbers", mahbersPage, trimmedSearch], context.previous);
      }
      toast.error(error?.response?.data?.message || "Failed to update organization status");
    },
    onSuccess: () => {
      toast.success("Organization status updated");
    },
    onSettled: invalidateMainLists,
  });

  const canAccess = user?.is_super_admin === true;
  const isRedirectingAway = user !== null && user.is_super_admin !== true;

  const forbiddenError = useMemo(() => {
    const candidates = [
      statsQuery.error,
      usersQuery.error,
      mahbersQuery.error,
      paymentsQuery.error,
      auditQuery.error,
    ] as Array<any>;
    return candidates.find((err) => err?.response?.status === 403);
  }, [statsQuery.error, usersQuery.error, mahbersQuery.error, paymentsQuery.error, auditQuery.error]);

  const renderPaginator = (
    meta: PaginationMeta | undefined,
    page: number,
    setPage: (pageNum: number) => void,
  ) => (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-text-secondary">
        {meta ? `Total ${meta.total} items` : "No pagination metadata"}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <span className="text-xs text-text-secondary px-2">
          Page {meta?.page ?? page} / {meta?.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta || page >= meta.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-text-secondary">
          {isRedirectingAway ? "Redirecting to dashboard..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (forbiddenError) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <h2 className="text-xl font-semibold">Access denied (403)</h2>
          <p className="text-text-secondary">
            Backend rejected this session for super-admin endpoints. Please re-login with a super admin account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        description="Platform-wide controls for users, organizations, payments, and audit logs."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-text-secondary">Users</p>
            <p className="text-2xl font-bold">{statsQuery.data?.users.total ?? "-"}</p>
            <p className="text-xs text-text-secondary">
              Active {statsQuery.data?.users.active ?? 0} / Suspended {statsQuery.data?.users.suspended ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-text-secondary">Super Admins</p>
            <p className="text-2xl font-bold">{statsQuery.data?.users.super_admins ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-text-secondary">Organizations</p>
            <p className="text-2xl font-bold">{statsQuery.data?.mahbers.total ?? "-"}</p>
            <p className="text-xs text-text-secondary">
              EQUB {statsQuery.data?.mahbers.breakdown?.EQUB ?? 0} | MAHBER{" "}
              {statsQuery.data?.mahbers.breakdown?.MAHBER ?? 0} | IDDIR{" "}
              {statsQuery.data?.mahbers.breakdown?.IDDIR ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-text-secondary">Payment Volume (ETB)</p>
            <p className="text-2xl font-bold">
              {(statsQuery.data?.payments.total_volume_etb ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              Completed {statsQuery.data?.payments.completed ?? 0} / Failed {statsQuery.data?.payments.failed ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex gap-2 flex-wrap">
              {(["users", "mahbers", "payments", "audit"] as TabKey[]).map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "audit" ? "Audit Logs" : tab[0].toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>
            {activeTab !== "audit" && (
              <Input
                placeholder={
                  activeTab === "users"
                    ? "Search users (name/phone/email)"
                    : activeTab === "mahbers"
                      ? "Search organizations by name"
                      : "Search payments by tx_ref"
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setUsersPage(1);
                  setMahbersPage(1);
                  setPaymentsPage(1);
                }}
                className="w-full md:w-96"
              />
            )}
          </div>

          {activeTab === "users" && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Super Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(usersQuery.data?.data ?? []).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{entry.phone}</TableCell>
                      <TableCell>{entry.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={entry.is_suspended ? "destructive" : "success"}>
                          {entry.is_suspended ? "Suspended" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={entry.is_super_admin}
                          onCheckedChange={(checked) =>
                            userSuperAdminMutation.mutate({ id: entry.id, isSuperAdmin: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUserId(entry.id)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={entry.is_suspended ? "secondary" : "destructive"}
                          onClick={() =>
                            userStatusMutation.mutate({
                              id: entry.id,
                              isSuspended: !entry.is_suspended,
                            })
                          }
                        >
                          {entry.is_suspended ? "Unsuspend" : "Suspend"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPaginator(usersQuery.data?.meta, usersPage, setUsersPage)}
            </>
          )}

          {activeTab === "mahbers" && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(mahbersQuery.data?.data ?? []).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{entry.type}</TableCell>
                      <TableCell>{entry.member_count}</TableCell>
                      <TableCell>
                        <Badge variant={entry.is_suspended ? "destructive" : "success"}>
                          {entry.is_suspended ? "Suspended" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedMahberId(entry.id)}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={entry.is_suspended ? "secondary" : "destructive"}
                          onClick={() =>
                            mahberStatusMutation.mutate({
                              id: entry.id,
                              isSuspended: !entry.is_suspended,
                            })
                          }
                        >
                          {entry.is_suspended ? "Unsuspend" : "Suspend"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPaginator(mahbersQuery.data?.meta, mahbersPage, setMahbersPage)}
            </>
          )}

          {activeTab === "payments" && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TX Ref</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paymentsQuery.data?.data ?? []).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.tx_ref}</TableCell>
                      <TableCell>{entry.payment_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === "Completed"
                              ? "success"
                              : entry.status === "Failed"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(entry.amount).toLocaleString()} ETB</TableCell>
                      <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPaginator(paymentsQuery.data?.meta, paymentsPage, setPaymentsPage)}
            </>
          )}

          {activeTab === "audit" && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(auditQuery.data?.data ?? []).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>
                        {entry.entity_type} ({entry.entity_id})
                      </TableCell>
                      <TableCell>{entry.actor?.name || entry.actor_id || "System"}</TableCell>
                      <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPaginator(auditQuery.data?.meta, auditPage, setAuditPage)}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        title="User details"
        description="Full profile and memberships."
      >
        {userDetailsQuery.isLoading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : userDetailsQuery.data ? (
          <div className="space-y-3 text-sm">
            <p><span className="text-text-secondary">Name:</span> {userDetailsQuery.data.name}</p>
            <p><span className="text-text-secondary">Phone:</span> {userDetailsQuery.data.phone}</p>
            <p><span className="text-text-secondary">Email:</span> {userDetailsQuery.data.email || "-"}</p>
            <p><span className="text-text-secondary">Bio:</span> {userDetailsQuery.data.bio || "-"}</p>
            <div className="pt-2">
              <p className="font-semibold mb-1">Memberships</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {(userDetailsQuery.data.memberships ?? []).map((membership) => (
                  <div key={membership.id} className="text-xs p-2 rounded border border-border-glass">
                    {membership.mahber?.name || membership.mahber?.id || membership.id} - {membership.status}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-status-error">No user details found.</p>
        )}
      </Dialog>

      <Dialog
        isOpen={!!selectedMahberId}
        onClose={() => setSelectedMahberId(null)}
        title="Organization details"
        description="Configuration, members, and recent payments."
      >
        {mahberDetailsQuery.isLoading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : mahberDetailsQuery.data ? (
          <div className="space-y-3 text-sm">
            <p><span className="text-text-secondary">Name:</span> {mahberDetailsQuery.data.name}</p>
            <p><span className="text-text-secondary">Type:</span> {mahberDetailsQuery.data.type}</p>
            <p><span className="text-text-secondary">Members:</span> {mahberDetailsQuery.data.members.length}</p>
            <div className="pt-2">
              <p className="font-semibold mb-1">Recent payments</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {(mahberDetailsQuery.data.recent_payments ?? []).map((payment) => (
                  <div key={payment.id} className="text-xs p-2 rounded border border-border-glass">
                    {payment.tx_ref} - {Number(payment.amount).toLocaleString()} ETB ({payment.status})
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-status-error">No organization details found.</p>
        )}
      </Dialog>
    </div>
  );
}
