import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function canManageEvents(member?: unknown) {
  const record = member as
    | {
        role?: unknown;
        permissions?: string[];
        role_name?: string;
      }
    | undefined;
  const directPermissions = record?.permissions ?? [];
  const role = record?.role;
  const rolePermissions =
    role && typeof role === "object" && "permissions" in role
      ? ((role as { permissions?: string[] }).permissions ?? [])
      : [];
  const roleName =
    role && typeof role === "object" && "name" in role
      ? String((role as { name?: string }).name ?? "")
      : record?.role_name ?? "";

  return (
    directPermissions.includes("create_events") ||
    rolePermissions.includes("create_events") ||
    roleName.toLowerCase() === "admin"
  );
}
