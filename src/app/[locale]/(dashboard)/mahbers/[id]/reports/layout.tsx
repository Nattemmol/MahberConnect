"use client";

import { use, useEffect } from "react";
import { useMahberMembership } from "@/lib/hooks/use-mahber-membership";
import { useRouter } from "@/i18n/routing";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { canViewReports, isLoading, isSuccess } = useMahberMembership(id);

  useEffect(() => {
    if (isSuccess && !canViewReports) {
      router.replace(`/mahbers/${id}`);
    }
  }, [isSuccess, canViewReports, id, router]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!canViewReports) return null;

  return <>{children}</>;
}
