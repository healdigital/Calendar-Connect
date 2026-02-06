"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui";
import { Icon } from "@calcom/ui/components/icon";
import { showToast } from "@calcom/ui/components/toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function IncidentsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [page] = useState(1);
  const pageSize = 20;

  const {
    data: incidentsData,
    isLoading: isLoadingIncidents,
    error,
    refetch,
  } = trpc.thotis.admin.listIncidents.useQuery(
    {
      page,
      pageSize,
    },
    {
      enabled: sessionStatus === "authenticated" && session?.user?.role === "ADMIN",
      retry: false,
    }
  );

  const moderationMutation = trpc.thotis.admin.takeModerationAction.useMutation({
    onSuccess: () => {
      showToast(t("thotis_moderation_action_success"), "success");
      refetch();
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const resolveMutation = trpc.thotis.admin.resolveIncident.useMutation({
    onSuccess: () => {
      showToast(t("thotis_incident_resolved_success"), "success");
      refetch();
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  const isLoading = sessionStatus === "loading" || (sessionStatus === "authenticated" && isLoadingIncidents);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
      </div>
    );
  }

  if (
    sessionStatus === "unauthenticated" ||
    (sessionStatus === "authenticated" && session?.user?.role !== "ADMIN")
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-emphasis mb-2 text-2xl font-bold">{t("unauthorized")}</h1>
        <p className="text-subtle mb-6">{t("unauthorized_admin_only")}</p>
        <Button onClick={() => router.push("/")}>{t("back_to_home")}</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-emphasis mb-2 text-2xl font-bold">{t("error")}</h1>
        <p className="text-subtle mb-6">{error.message}</p>
        <Button onClick={() => router.back()}>{t("back")}</Button>
      </div>
    );
  }

  const incidents = incidentsData?.incidents || [];

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-subtle hover:text-emphasis mb-2 flex items-center text-sm">
            <Icon name="arrow-left" className="mr-1 h-4 w-4" />
            {t("back")}
          </button>
          <h1 className="text-2xl font-bold text-emphasis">{t("thotis_all_incidents")}</h1>
        </div>
      </div>

      <div className="bg-default border-subtle rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-subtle border-subtle text-subtle border-b text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">{t("type")}</th>
                <th className="px-6 py-3 font-semibold">{t("description")}</th>
                <th className="px-6 py-3 font-semibold">{t("status")}</th>
                <th className="px-6 py-3 font-semibold">{t("date")}</th>
                <th className="px-6 py-3 font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-subtle divide-y">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-subtle">
                    {t("thotis_no_incidents_found")}
                  </td>
                </tr>
              ) : (
                incidents.map((incident: any) => (
                  <tr key={incident.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-emphasis">{incident.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md truncate text-subtle" title={incident.description}>
                        {incident.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          incident.resolved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                        {incident.resolved ? t("resolved") : t("unresolved")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-subtle">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {!incident.resolved && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={
                              resolveMutation.isPending &&
                              resolveMutation.variables?.incidentId === incident.id
                            }
                            onClick={() => resolveMutation.mutate({ incidentId: incident.id })}>
                            {t("thotis_resolve")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          color="secondary"
                          loading={
                            moderationMutation.isPending &&
                            moderationMutation.variables?.studentProfileId === incident.studentProfileId &&
                            moderationMutation.variables?.actionType === "WARNING"
                          }
                          onClick={() =>
                            moderationMutation.mutate({
                              studentProfileId: incident.studentProfileId,
                              actionType: "WARNING",
                              reason: "Moderation action from incident report",
                            })
                          }>
                          {t("thotis_warn")}
                        </Button>
                        <Button
                          size="sm"
                          color="destructive"
                          loading={
                            moderationMutation.isPending &&
                            moderationMutation.variables?.studentProfileId === incident.studentProfileId &&
                            moderationMutation.variables?.actionType === "SUSPENSION"
                          }
                          onClick={() => {
                            if (confirm(t("thotis_confirm_suspend_mentor"))) {
                              moderationMutation.mutate({
                                studentProfileId: incident.studentProfileId,
                                actionType: "SUSPENSION",
                                updateStatusTo: "SUSPENDED",
                                reason: "Suspended due to incident report",
                              });
                            }
                          }}>
                          {t("thotis_suspend")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
