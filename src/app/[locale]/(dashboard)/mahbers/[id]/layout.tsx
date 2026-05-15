"use client";

import { use, useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";

export default function MahberDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const setActiveMahber = useUIStore((state) => state.setActiveMahber);

  useEffect(() => {
    // When this layout mounts (user enters a Mahber's context), tell the store
    setActiveMahber(id);

    // When the user leaves this layout (navigates back to dashboard), clear the context
    return () => {
      setActiveMahber(null);
    };
  }, [id, setActiveMahber]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {children}
    </div>
  );
}
