import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Icon } from "@calcom/ui/components/icon";
import { useState } from "react";
import { SessionManagementUI } from "./SessionManagementUI";

interface StudentDashboardProps {
  email: string;
  token?: string;
}

export const StudentDashboard = ({ email, token }: StudentDashboardProps) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const utils = trpc.useUtils();

  // Guest Query
  const { data: guestSessions, isLoading: isLoadingGuest } = trpc.thotis.guest.getSessionsByToken.useQuery(
    { token: token!, status: activeTab },
    { enabled: !!token }
  );

  // Authenticated Student Query
  const { data: studentSessions, isLoading: isLoadingStudent } = trpc.thotis.booking.studentSessions.useQuery(
    { status: activeTab, email },
    { enabled: !token && !!email }
  );

  const isLoading = token ? isLoadingGuest : isLoadingStudent;
  const sessions = token ? guestSessions : studentSessions;

  const handleActionComplete = () => {
    if (token) {
      utils.thotis.guest.getSessionsByToken.invalidate();
    } else {
      utils.thotis.booking.studentSessions.invalidate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-emphasis text-2xl font-bold">{t("thotis_my_sessions")}</h1>
        <p className="text-subtle text-sm">{email}</p>
      </div>

      {/* Tabs */}
      <div className="border-subtle flex gap-0 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "upcoming"
              ? "text-emphasis border-b-2 border-blue-600"
              : "text-subtle hover:text-emphasis"
          }`}>
          {t("thotis_upcoming_sessions")}
          {/* Guest sessions count logic if needed, straightforward since we fetch by status */}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "past"
              ? "text-emphasis border-b-2 border-blue-600"
              : "text-subtle hover:text-emphasis"
          }`}>
          {t("thotis_past_sessions")}
        </button>
      </div>

      {/* Session List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="border-emphasis h-8 w-8 animate-spin rounded-full border-b-2 border-t-2" />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="border-subtle bg-default rounded-lg border py-12 text-center">
          <Icon name="calendar" className="text-subtle mx-auto mb-3 h-10 w-10" />
          <p className="text-emphasis text-sm font-medium">
            {activeTab === "upcoming" ? t("thotis_no_upcoming_sessions") : t("thotis_no_past_sessions")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionManagementUI
              key={session.id}
              booking={session}
              isMentor={false}
              onActionComplete={handleActionComplete}
              token={token} // Pass token to UI for actions
            />
          ))}
        </div>
      )}
    </div>
  );
};
