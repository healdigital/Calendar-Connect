import dayjs from "@calcom/dayjs";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useRef, useState } from "react";
import { SessionManagementUI } from "./SessionManagementUI";

const RequestLinkInline = () => {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const mutation = trpc.thotis.guest.requestInboxLink.useMutation({
    onSuccess: () => setSuccess(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mutation.mutate({ email });
  };

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
        <p className="font-semibold">{t("thotis_link_sent")}</p>
        <p>{t("thotis_check_email_for_link")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        <Button type="submit" loading={mutation.isPending}>
          {t("thotis_send_link")}
        </Button>
      </div>
    </form>
  );
};

interface StudentDashboardProps {
  email: string;
  token?: string;
}

import { StudentSettings } from "./StudentSettings";

export const StudentDashboard = ({ email, token }: StudentDashboardProps) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled" | "settings">("upcoming");
  const utils = trpc.useUtils();

  // Authenticated User Data
  const { data: me } = trpc.viewer.me.useQuery(undefined, { enabled: !token });

  // Guest Query
  const {
    data: guestSessions,
    isPending: isPendingGuest,
    error: guestError,
  } = trpc.thotis.guest.getSessionsByToken.useQuery(
    { token: token!, status: activeTab === "settings" ? "upcoming" : activeTab },
    { enabled: !!token }
  );

  // Authenticated Student Query
  const {
    data: studentSessions,
    isPending: isPendingStudent,
    error: studentError,
  } = trpc.thotis.booking.studentSessions.useQuery(
    { status: activeTab === "settings" ? "upcoming" : activeTab },
    { enabled: !token && !!email && activeTab !== "settings" }
  );

  const isPending = token ? isPendingGuest : isPendingStudent;
  const sessions = token ? guestSessions : studentSessions;
  const error = token ? guestError : studentError;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-emphasis text-2xl font-bold">{t("thotis_my_sessions")}</h1>
          <p className="text-subtle text-sm">{email}</p>
        </div>
        {!token && (
          <Button color="secondary" href="/thotis/dashboard" className="gap-2">
            <Icon name="external-link" className="h-4 w-4" />
            {t("thotis_mentor_view")}
          </Button>
        )}
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
        <button
          type="button"
          onClick={() => setActiveTab("cancelled")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "cancelled"
              ? "text-emphasis border-b-2 border-blue-600"
              : "text-subtle hover:text-emphasis"
          }`}>
          {t("thotis_cancelled_sessions")}
        </button>
        {!token && (
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "settings"
                ? "text-emphasis border-b-2 border-blue-600"
                : "text-subtle hover:text-emphasis"
            }`}>
            {t("settings")}
          </button>
        )}
      </div>

      {activeTab === "settings" && me ? (
        <StudentSettings user={{ id: me.id, name: me.name, email: me.email }} />
      ) : (
        /* Session List */
        <>
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-emphasis h-8 w-8 animate-spin rounded-full border-b-2 border-t-2" />
            </div>
          ) : error ? (
            <div className="border-subtle bg-default rounded-lg border py-12 text-center">
              <Icon
                name={
                  token && (error.data?.code === "UNAUTHORIZED" || error.data?.code === "FORBIDDEN")
                    ? "lock"
                    : "circle-alert"
                }
                className="text-subtle mx-auto mb-3 h-10 w-10"
              />
              <h3 className="text-emphasis mb-2 text-lg font-bold">
                {token && (error.data?.code === "UNAUTHORIZED" || error.data?.code === "FORBIDDEN")
                  ? t("thotis_token_expired_title")
                  : t("thotis_something_wrong")}
              </h3>
              {token && (error.data?.code === "UNAUTHORIZED" || error.data?.code === "FORBIDDEN") ? (
                <div className="space-y-4">
                  <p className="text-subtle text-sm max-w-md mx-auto">
                    {t("thotis_token_expired_description")}
                  </p>
                  <RequestLinkInline />
                </div>
              ) : (
                <p className="text-subtle text-sm">{error.message}</p>
              )}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="border-subtle bg-default rounded-lg border py-12 text-center">
              <Icon name="calendar" className="text-subtle mx-auto mb-3 h-10 w-10" />
              <p className="text-emphasis text-sm font-medium">
                {activeTab === "upcoming"
                  ? t("thotis_no_upcoming_sessions")
                  : activeTab === "past"
                    ? t("thotis_no_past_sessions")
                    : t("thotis_no_cancelled_sessions")}
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
        </>
      )}
    </div>
  );
};
