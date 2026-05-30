"use client";

import { use } from "react";
import Link from "next/link";
import { BarChart3, FileText, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvisorReadOnlyBanner } from "@/components/reports/advisor-read-only-banner";
import { useMahberMembership } from "@/lib/hooks/use-mahber-membership";

export default function ReportsHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isReadOnly } = useMahberMembership(id);

  const cards = [
    {
      href: `/mahbers/${id}/reports/financial`,
      title: "Financial report",
      description: "Contributions, fines, expenses, payouts, and net balance.",
      icon: FileText,
    },
    {
      href: `/mahbers/${id}/reports/attendance`,
      title: "Attendance report",
      description: "Monthly attendance trends and PDF export.",
      icon: BarChart3,
    },
    {
      href: `/mahbers/${id}/audit`,
      title: "Audit trail",
      description: "Read-only log of mahber activity and changes.",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Financial and attendance insights for your mahber."
      />
      {isReadOnly && <AdvisorReadOnlyBanner />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-colors hover:border-gold/40">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
