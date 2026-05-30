"use client";

import { use, useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useQuery } from "@tanstack/react-query";
import { mahberService } from "@/lib/api/service-factory";
import { usePathname, useRouter } from "@/i18n/routing";
import { useMahberMembership } from "@/lib/hooks/use-mahber-membership";
import { isReadOnlyBlockedPath } from "@/lib/utils/permissions";

export default function MahberDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const setActiveMahber = useUIStore((state) => state.setActiveMahber);
  const pathname = usePathname();
  const router = useRouter();

  const { data: myMahbers, isSuccess } = useQuery({
    queryKey: ["mahbers"],
    queryFn: () => mahberService.getMahbers(),
  });

  const {
    isReadOnly,
    isSuccess: membershipReady,
    canViewReports,
  } = useMahberMembership(id);

  const isFullyJoined = Array.isArray(myMahbers) && myMahbers.some((m) => m.id === id);
  const isOverviewPage = pathname === `/mahbers/${id}`;

  useEffect(() => {
    setActiveMahber(id);
    return () => {
      setActiveMahber(null);
    };
  }, [id, setActiveMahber]);

  useEffect(() => {
    if (isSuccess && !isFullyJoined && !isOverviewPage) {
      router.replace(`/mahbers/${id}`);
    }
  }, [isSuccess, isFullyJoined, isOverviewPage, id, router]);

  useEffect(() => {
    if (!isFullyJoined || !membershipReady || !isReadOnly) return;

    if (isOverviewPage && canViewReports) {
      router.replace(`/mahbers/${id}/reports`);
      return;
    }

    if (isReadOnlyBlockedPath(pathname, id)) {
      router.replace(`/mahbers/${id}/reports`);
    }
  }, [
    isFullyJoined,
    membershipReady,
    isReadOnly,
    isOverviewPage,
    canViewReports,
    pathname,
    id,
    router,
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {children}
    </div>
  );
}
