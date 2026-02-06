import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useState } from "react";
import { SessionManagementUI } from "./SessionManagementUI";

interface MentorDashboardProps {
  userId: number;
}

export const MentorDashboard = ({ userId }: MentorDashboardProps) => {
  const { t } = useLocale();
  const [sessionTab, setSessionTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  // Fetch mentor stats
  const { data: stats, isPending: isPendingStats } = trpc.thotis.statistics.studentStats.useQuery(
    { studentId: userId },
    { enabled: !!userId }
  );

  // Fetch mentor profile
  const { data: profile } = trpc.thotis.profile.get.useQuery();

  // Fetch sessions with pagination
  const { data: sessionsData, isPending: isPendingSessions } = trpc.thotis.booking.mentorSessions.useQuery(
    { status: sessionTab, page: 1, pageSize: 20 },
    { enabled: !!userId }
  );

  if (isPendingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-emphasis h-10 w-10 animate-spin rounded-full border-b-2 border-t-2" />
      </div>
    );
  }

  const statCards = [
    {
      label: t("thotis_upcoming_count"),
      value: (stats?.totalSessions ?? 0) - (stats?.completedSessions ?? 0) - (stats?.cancelledSessions ?? 0),
      icon: "calendar" as const,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: t("thotis_completed_count"),
      value: stats?.completedSessions ?? 0,
      icon: "check-circle" as const,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: t("thotis_cancelled_count"),
      value: stats?.cancelledSessions ?? 0,
      icon: "x-circle" as const,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: t("thotis_avg_rating"),
      value: stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "N/A",
      icon: "star" as const,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-emphasis text-2xl font-bold">{t("thotis_mentor_dashboard")}</h1>
          {profile && (
            <p className="text-subtle text-sm">
              {(profile as { university?: string }).university} &middot;{" "}
              {(profile as { field?: string }).field}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button color="secondary" href="/thotis/mentor/settings" className="gap-2">
            <Icon name="settings" className="h-4 w-4" />
            {t("settings")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-default border-subtle rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor}`}>
                <Icon
                  name={card.icon === "check-circle" ? "check" : card.icon === "x-circle" ? "x" : card.icon}
                  className={`h-5 w-5 ${card.color}`}
                />
              </div>
              <div>
                <p className="text-subtle text-xs font-medium">{card.label}</p>
                <p className="text-emphasis text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Management Section */}
      <div>
        <h2 className="text-emphasis mb-4 text-lg font-semibold">{t("thotis_manage_sessions")}</h2>

        {/* Session Tabs */}
        <div className="border-subtle mb-4 flex gap-0 border-b">
          {(["upcoming", "past", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSessionTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                sessionTab === tab
                  ? "text-emphasis border-b-2 border-blue-600"
                  : "text-subtle hover:text-emphasis"
              }`}>
              {tab === "upcoming"
                ? t("thotis_upcoming_sessions")
                : tab === "past"
                  ? t("thotis_past_sessions")
                  : t("thotis_cancelled_count")}
              {sessionsData && tab === sessionTab && sessionsData.total > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700">
                  {sessionsData.total}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {isPendingSessions ? (
          <div className="flex items-center justify-center py-8">
            <div className="border-emphasis h-8 w-8 animate-spin rounded-full border-b-2 border-t-2" />
          </div>
        ) : !sessionsData?.bookings || sessionsData.bookings.length === 0 ? (
          <div className="border-subtle bg-default rounded-lg border py-12 text-center">
            <Icon name="calendar" className="text-subtle mx-auto mb-3 h-10 w-10" />
            <p className="text-emphasis text-sm font-medium">{t("thotis_no_sessions_yet")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionsData.bookings.map((booking: any) => (
              <SessionManagementUI key={booking.id} booking={booking} isMentor />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
