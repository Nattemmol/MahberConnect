"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/lib/api/service-factory";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  hasPermission,
  isAdvisorRole,
  isReadOnlyRole,
  PERMISSIONS,
  roleFromMember,
} from "@/lib/utils/permissions";

export function useMahberMembership(mahberId: string) {
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: ["mahber-membership", mahberId, user?.id],
    queryFn: () => memberService.getMembers(mahberId, 1, 100),
    enabled: Boolean(mahberId && user?.id),
  });

  const membership = useMemo(
    () => query.data?.data?.find((m) => m.user?.id === user?.id),
    [query.data, user?.id],
  );

  const role = useMemo(() => roleFromMember(membership), [membership]);

  const canViewReports = hasPermission(
    role.permissions,
    PERMISSIONS.VIEW_REPORTS,
  );
  const canManageFinances = hasPermission(
    role.permissions,
    PERMISSIONS.MANAGE_FINANCES,
  );
  const canManageMembers = hasPermission(
    role.permissions,
    PERMISSIONS.MANAGE_MEMBERS,
  );
  const canManageRoles = hasPermission(
    role.permissions,
    PERMISSIONS.MANAGE_ROLES,
  );
  const canCreateEvents = hasPermission(
    role.permissions,
    PERMISSIONS.CREATE_EVENTS,
  );
  const isReadOnly = isReadOnlyRole(role);
  const isAdvisor = isAdvisorRole(role);

  return {
    membership,
    role,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    canViewReports,
    canManageFinances,
    canManageMembers,
    canManageRoles,
    canCreateEvents,
    isReadOnly,
    isAdvisor,
  };
}
