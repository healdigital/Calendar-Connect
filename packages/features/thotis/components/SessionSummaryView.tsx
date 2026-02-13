import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button, Dialog, DialogContent, Icon } from "@calcom/ui";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SessionSummaryViewProps {
  bookingId: number;
  token?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionSummaryView({ bookingId, token, open, onOpenChange }: SessionSummaryViewProps) {
  const { t } = useLocale();
  const router = useRouter();

  // Conditional query: uses token endpoint if token exists, otherwise authenticated endpoint
  const guestQuery = trpc.thotis.guest.getPostSessionDataByToken.useQuery(
    { bookingId, token: token! },
    { enabled: open && !!token }
  );

  const authQuery = trpc.thotis.booking.getPostSessionData.useQuery(
    { bookingId },
    { enabled: open && !token }
  );

  const { data, isPending } = token ? guestQuery : authQuery;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        title={t("thotis_session_summary_title", "Résumé de la session")}
        description={t(
          "thotis_session_summary_desc",
          "Récapitulatif et ressources fournis par votre mentor."
        )}>
        {isPending ? (
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
          </div>
        ) : !data || !data.summary ? (
          <div className="text-center py-8 text-gray-500">
            {t("thotis_no_summary_yet", "No summary available yet.")}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Content */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">{t("thotis_key_takeaways", "Points clés")}</h3>
              <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                {data.summary.content}
              </div>
            </div>

            {/* Action Plan */}
            {data.summary.nextSteps && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">{t("thotis_next_steps", "Plan d'action")}</h3>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-md text-sm text-blue-900 whitespace-pre-wrap">
                  {data.summary.nextSteps}
                </div>
              </div>
            )}

            {/* Resources */}
            {data.resources && data.resources.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">
                  {t("thotis_resources", "Ressources recommandées")}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.resources.map((resource: { id: string | number; url: string; type: string; title: string }) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="bg-gray-100 p-2 rounded-md group-hover:bg-white transition-colors">
                        {resource.type === "LINK" ? (
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Download className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                        <p className="text-xs text-gray-500 truncate">{resource.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="pt-6 mt-6 border-t flex justify-end">
              <Button color="primary" onClick={() => router.push("/thotis")}>
                {t("thotis_ask_new_question", "Poser une nouvelle question")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
