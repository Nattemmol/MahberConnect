"use client";

import { use, useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useQuery } from "@tanstack/react-query";
import { mahberService } from "@/lib/api/service-factory";
import { usePathname, useRouter } from "@/i18n/routing";

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

  const isFullyJoined = Array.isArray(myMahbers) && myMahbers.some((m) => m.id === id);
  const isOverviewPage = pathname === `/mahbers/${id}`;

  useEffect(() => {
    // When this layout mounts (user enters a Mahber's context), tell the store
    setActiveMahber(id);

    // When the user leaves this layout (navigates back to dashboard), clear the context
    return () => {
      setActiveMahber(null);
    };
  }, [id, setActiveMahber]);

  useEffect(() => {
    // Redirect if they try to access internal pages without being a member
    if (isSuccess && !isFullyJoined && !isOverviewPage) {
      router.replace(`/mahbers/${id}`);
    }
  }, [isSuccess, isFullyJoined, isOverviewPage, id, router]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {children}
    </div>
  );
}
