"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import Link from "next/link";
import { mahberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MahberOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: mahber, isLoading } = useQuery({
    queryKey: ["mahber", id],
    queryFn: () => mahberService.getMahberById(id),
  });

  const contributionAmount =
    typeof mahber?.configuration?.contribution_amount === "number"
      ? mahber.configuration.contribution_amount
      : null;

  const cycle =
    typeof mahber?.configuration?.cycle === "string"
      ? mahber.configuration.cycle
      : null;

  const displayCycle = cycle
    ? `${cycle.charAt(0).toUpperCase()}${cycle.slice(1)}`
    : "—";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mahber" description="Loading mahber details..." />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((index) => (
            <Card key={index}>
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!mahber) {
    return (
      <div className="text-center py-20 glass rounded-card">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Mahber Not Found
        </h3>
        <p className="text-text-secondary mb-6">
          We couldn&apos;t load this mahber. It may have been removed.
        </p>
        <Button asChild>
          <Link href="/mahbers">Back to Mahbers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mahber.name}
        description="Mahber overview and configuration."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/mahbers/${id}/members`}>Members</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/mahbers/${id}/payments`}>Payments</Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  mahber.type === "EQUB"
                    ? "success"
                    : mahber.type === "IDDIR"
                      ? "warning"
                      : "default"
                }
              >
                {mahber.type}
              </Badge>
              <Badge variant={mahber.is_public ? "outline" : "secondary"}>
                {mahber.is_public ? "Public" : "Private"}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-text-secondary">Invitation Code</p>
              <p className="text-base text-text-primary">
                {mahber.invitation_code || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">Created</p>
              <p className="text-base text-text-primary">
                {new Date(mahber.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">Last Updated</p>
              <p className="text-base text-text-primary">
                {new Date(mahber.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary">Contribution Amount</p>
              <p className="text-base text-text-primary">
                {contributionAmount ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-text-secondary">Cycle</p>
              <p className="text-base text-text-primary">{displayCycle}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
