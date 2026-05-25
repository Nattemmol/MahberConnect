"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  User,
  Clock,
  Search,
  Filter,
  AlertCircle,
  BarChart3,
  Download,
  TrendingUp,
} from "lucide-react";
import { eventService, memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import toast from "react-hot-toast";

export default function EventAttendancePage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = use(params);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("EventAttendance");

  const { data: event } = useQuery({
    queryKey: ["mahber-event", id, eventId],
    queryFn: () => eventService.getEventById(id, eventId),
  });

  const {
    data: attendanceResponse,
    isLoading,
    isError: isAttendanceError,
  } = useQuery({
    queryKey: ["event-attendance", id, eventId],
    queryFn: () => eventService.getAttendance(id, eventId),
  });

  const isPastEvent = event ? new Date(event.start_time) <= new Date() : false;
  const showAbsentees = Boolean(
    event?.is_mandatory && isPastEvent && !isAttendanceError,
  );

  const { data: membersResponse, isLoading: isMembersLoading } = useQuery({
    queryKey: ["mahber-members-all", id],
    queryFn: () => memberService.getMembers(id, 1, 1000),
    enabled: showAbsentees,
  });

  const attendance = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : [];
  const totalAttendees = attendance.length;
  const members = Array.isArray(membersResponse?.data) ? membersResponse.data : [];

  const activeMembers = members.filter((m) => m.status === "Active");
  const attendanceMemberIds = new Set(attendance.map((a) => a.member_id));
  const absentMembers = activeMembers.filter(
    (m) => !attendanceMemberIds.has(m.member_id),
  );
  const filteredAbsentees = absentMembers.filter(
    (member) =>
      member.user?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      member.user?.phone?.includes(searchQuery),
  );

  const isAbsenteesLoading = isMembersLoading;

  // ── Analytics ──
  const { data: analytics } = useQuery({
    queryKey: ["event-attendance-analytics", id, eventId],
    queryFn: () => eventService.getAttendanceAnalytics(id, eventId),
  });

  const { data: trends } = useQuery({
    queryKey: ["event-attendance-trends", id],
    queryFn: () => eventService.getAttendanceTrends(id, eventId, 6),
  });

  const hasTrends = Boolean(trends?.trends && trends.trends.length > 0);

  const handleExportReport = async () => {
    try {
      const blob = await eventService.exportAttendanceReport(id, eventId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-report-${id}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t('exportFailed'));
    }
  };

  // Filter attendance based on search query
  const filteredAttendance = attendance.filter(
    (record) =>
      record.user?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      record.user?.phone?.includes(searchQuery),
  );

  // Group attendance by check-in time
  const morningCount = attendance.filter((a) => {
    const hour = new Date(a.checked_in_at).getHours();
    return hour < 12;
  }).length;

  const afternoonCount = attendance.filter((a) => {
    const hour = new Date(a.checked_in_at).getHours();
    return hour >= 12 && hour < 18;
  }).length;

  const eveningCount = attendance.filter((a) => {
    const hour = new Date(a.checked_in_at).getHours();
    return hour >= 18;
  }).length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        {t('backToEvent')}
      </Button>

      <PageHeader
        title={t('title')}
        description={t('description', { event: event?.title || '' })}
      >
        <Button variant="outline" className="gap-2" onClick={handleExportReport}>
          <Download className="w-4 h-4" />
          {t('exportReport')}
        </Button>
      </PageHeader>

      {/* Future Event Notice — replaces all attendance content */}
      {event && !isPastEvent && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t('eventNotStarted')}
              </h3>
              <p className="text-text-secondary max-w-md mx-auto">
                {t('eventNotStartedDesc', {
                  date: new Date(event.start_time).toLocaleDateString(),
                  time: new Date(event.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Content — only for past / current events */}
      {(!event || isPastEvent) && (
      <>
      {/* Analytics Section */}
      {analytics && (
        <Card className="bg-gradient-to-br from-gold/5 to-background-dark border-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                <h3 className="font-semibold text-text-primary">{t('attendanceRate')}</h3>
              </div>
              <span className={`text-2xl font-bold ${analytics.attendance_percentage >= 75 ? 'text-status-success' : analytics.attendance_percentage >= 50 ? 'text-amber-400' : 'text-status-error'}`}>
                {analytics.attendance_percentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-background-dark/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  analytics.attendance_percentage >= 75 ? 'bg-status-success' : analytics.attendance_percentage >= 50 ? 'bg-amber-400' : 'bg-status-error'
                }`}
                style={{ width: `${analytics.attendance_percentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm text-text-secondary">
              <span>{t('attended', { count: analytics.attended })}</span>
              <span>{t('absent', { count: analytics.absent })}</span>
              <span>{t('total', { count: analytics.total_members })}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends Section */}
      {hasTrends && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              {t('monthlyTrends')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {trends!.trends.map((t) => {
                const maxRate = Math.max(...trends!.trends.map((x) => x.average_attendance_rate), 1);
                const height = (t.average_attendance_rate / maxRate) * 100;
                return (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-text-secondary font-medium">
                      {t.average_attendance_rate}%
                    </span>
                    <div
                      className="w-full rounded-t-sm transition-all duration-500"
                      style={{
                        height: `${height}%`,
                        backgroundColor: t.average_attendance_rate >= 75 ? '#15803d' : t.average_attendance_rate >= 50 ? '#f59e0b' : '#dc2626',
                        minHeight: '4px',
                      }}
                    />
                    <span className="text-[10px] text-text-muted mt-1">
                      {t.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-success inline-block" /> {t('good')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t('fair')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-error inline-block" /> {t('low')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Fair (50-74%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-error inline-block" /> Low (&lt;50%)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{t('totalCheckins')}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {isLoading ? "--" : totalAttendees}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-status-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-status-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{t('morning')}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {isLoading ? "--" : morningCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{t('afternoon')}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {isLoading ? "--" : afternoonCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{t('evening')}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {isLoading ? "--" : eveningCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        {showAbsentees && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{t('absentTitle')}</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {isAbsenteesLoading ? "--" : absentMembers.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-status-error/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-status-error" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {t('filter')}
        </Button>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('checkinList')}
            {totalAttendees > 0 && !isAttendanceError && (
              <Badge variant="secondary" className="ml-2">
                {t('members', { count: totalAttendees })}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAttendanceError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary">
                {t('listUnavailable')}
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary">
                {searchQuery
                  ? t('noSearchResults')
                  : t('noCheckins')}
              </p>
              {searchQuery && (
                <Button
                  variant="link"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-gold"
                >
                  {t('clearSearch')}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface-hover/30 hover:bg-surface-hover/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      {record.user?.name ? (
                        <span className="text-sm font-semibold text-gold">
                          {record.user.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {record.user?.name || t('unknownMember')}
                      </p>
                      <p className="text-sm text-text-muted">
                        {record.user?.phone || t('noPhone')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {t('checkedIn')}
                    </Badge>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(record.checked_in_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Absent Members List */}
      {showAbsentees && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('absentMembers')}
              {absentMembers.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {t('members', { count: absentMembers.length })}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAbsenteesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredAbsentees.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-text-secondary">
                  {searchQuery
                    ? t('noAbsentSearch')
                    : t('noAbsences')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAbsentees.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-status-error/5 hover:bg-status-error/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-status-error/10 flex items-center justify-center">
                        {member.user?.name ? (
                          <span className="text-sm font-semibold text-status-error">
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <User className="w-5 h-5 text-text-muted" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {member.user?.name || t('unknownMember')}
                        </p>
                        <p className="text-sm text-text-muted">
                          {member.user?.phone || t('noPhone')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('absentLabel')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
    )}
    </div>
  );
}
