"use client";

import { useMahberMembership } from "@/lib/hooks/use-mahber-membership";
import { hasPermission } from "@/lib/utils/permissions";

type ProtectedUIProps = {
  mahberId: string;
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ProtectedUI({
  mahberId,
  permission,
  children,
  fallback = null,
}: ProtectedUIProps) {
  const { role, isLoading } = useMahberMembership(mahberId);

  if (isLoading) return null;
  if (!hasPermission(role.permissions, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
