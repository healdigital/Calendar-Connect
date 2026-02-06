"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui";
import { Icon } from "@calcom/ui/components/icon";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function IncidentsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data: incidentsData,
    isLoading: isLoadingIncidents,
    error,
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
        <h1 className="text-2xl font-bold text-emphasis mb-2">{t("unauthorized")}</h1>
        <p className="text-subtle mb-6">{t("unauthorized_admin_only")}</p>
        <Button onClick={() => router.push("/")}>{t("back_to_home")}</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-emphasis mb-2">{t("error")}</h1>
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
            className="mb-2 flex items-center text-sm text-subtle hover:text-emphasis">
            <Icon name="arrow-left" className="mr-1 h-4 w-4" />
            {t("back")}
          </button>
          <h1 className="text-2xl font-bold text-emphasis">{t("thotis_all_incidents")}</h1>
        </div>
      </div>

      <div className="bg-default border-subtle rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-subtle border-subtle border-b text-xs uppercase text-subtle">
              <tr>
                <th className="px-6 py-3 font-semibold">{t("type")}</th>
                <th className="px-6 py-3 font-semibold">{t("description")}</th>
                <th className="px-6 py-3 font-semibold">{t("status")}</th>
                <th className="px-6 py-3 font-semibold">{t("date")}</th>
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
