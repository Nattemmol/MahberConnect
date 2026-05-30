"use client";

import { use, useEffect } from "react";
import { useRouter } from "@/i18n/routing";

/** Alias route for plan compatibility → existing audit page */
export default function AuditTrailAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/mahbers/${id}/audit`);
  }, [id, router]);

  return null;
}
