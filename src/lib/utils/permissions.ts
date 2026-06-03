import type { MemberDetail, MahberRoleDefinition, Permission, RoleName } from "@/lib/types";

export const PERMISSIONS = {
  MANAGE_MEMBERS: "manage_members",
  MANAGE_FINANCES: "manage_finances",
  CREATE_EVENTS: "create_events",
  SEND_ANNOUNCEMENTS: "send_announcements",
  VIEW_REPORTS: "view_reports",
  MANAGE_ROLES: "manage_roles",
  CREATE_EXPENSE: "create_expense",
  APPROVE_EXPENSE: "approve_expense",
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: [...Object.values(PERMISSIONS)],
  Treasurer: [PERMISSIONS.MANAGE_FINANCES, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.CREATE_EXPENSE],
  Secretary: [PERMISSIONS.CREATE_EVENTS, PERMISSIONS.SEND_ANNOUNCEMENTS],
  Advisor: [PERMISSIONS.VIEW_REPORTS],
  Member: [],
};

export const DEFAULT_MAHBER_ROLES: MahberRoleDefinition[] = [
  {
    name: "Admin" as RoleName,
    permissions: Object.values(PERMISSIONS) as Permission[],
    description: "Full control over all Mahber features.",
  },
  {
    name: "Treasurer" as RoleName,
    permissions: ["manage_finances", "view_reports", "create_expense"],
    description: "Manage finances, view reports, and create expenses.",
  },
  {
    name: "Secretary" as RoleName,
    permissions: ["create_events", "send_announcements"],
    description: "Manage events and announcements.",
  },
  {
    name: "Advisor" as RoleName,
    permissions: ["view_reports"],
    description:
      "Read-only access to financial and attendance reports and audit trail.",
  },
  {
    name: "Member" as RoleName,
    permissions: [],
    description: "Standard participation permissions.",
  },
];

export function hasPermission(
  permissions: string[],
  required: string,
): boolean {
  return permissions.includes(required);
}

export function isAdvisorRole(role: {
  name: string;
  permissions: string[];
}): boolean {
  return role.name === "Advisor";
}

export function isReadOnlyRole(role: {
  name: string;
  permissions: string[];
}): boolean {
  return (
    isAdvisorRole(role) ||
    (role.permissions.length === 1 &&
      role.permissions[0] === PERMISSIONS.VIEW_REPORTS)
  );
}

export function getMembershipRoleName(member?: MemberDetail | null): string {
  if (!member) return "Member";
  if (member.role_name) return member.role_name;
  const role = member.role as { name?: string } | string | undefined;
  if (role && typeof role === "object" && role.name) return role.name;
  if (role === "ADMIN") return "Admin";
  if (typeof role === "string") return role;
  return "Member";
}

export function getMembershipPermissions(
  member?: MemberDetail | null,
): string[] {
  if (!member) return [];
  if (member.permissions?.length) return member.permissions;
  const role = member.role as { permissions?: string[] } | undefined;
  if (role && typeof role === "object" && role.permissions?.length) {
    return role.permissions;
  }
  const roleName = getMembershipRoleName(member);
  return ROLE_PERMISSIONS[roleName] ?? ROLE_PERMISSIONS.Member;
}

export function roleFromMember(
  member?: MemberDetail | null,
): { name: string; permissions: string[] } {
  return {
    name: getMembershipRoleName(member),
    permissions: getMembershipPermissions(member),
  };
}

/** Paths Advisors cannot access (reports + audit allowed). */
export function isReadOnlyBlockedPath(
  pathname: string,
  mahberId: string,
): boolean {
  const base = `/mahbers/${mahberId}`;
  if (!pathname.startsWith(base)) return false;
  if (pathname.startsWith(`${base}/reports`)) return false;
  if (
    pathname.startsWith(`${base}/audit`) ||
    pathname.startsWith(`${base}/audit-trail`)
  ) {
    return false;
  }
  if (pathname === base) return true;

  const blockedSegments = [
    "/members",
    "/payments",
    "/events",
    "/chat",
    "/settings",
    "/join-requests",
    "/lottery",
    "/ledger",
    "/wallet",
    "/fines",
    "/announcements",
    "/polls",
    "/payouts",
    "/expenses",
  ];
  return blockedSegments.some((seg) => pathname.startsWith(`${base}${seg}`));
}
