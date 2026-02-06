import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import { ThotisBaseEmail } from "./ThotisBaseEmail";

export const MentorNudgeEmail = (props: {
  calEvent: CalendarEvent;
  attendee: Person;
  addSummaryLink: string;
}) => {
  const { t } = useLocale();
  const { attendee, addSummaryLink } = props;

  return (
    <ThotisBaseEmail
      subject={t("thotis_mentor_nudge_subject", "Résumé de session en attente")}
      title={t("thotis_mentor_nudge_title", "N'oubliez pas le résumé !")}
      subtitle={t("thotis_mentor_nudge_subtitle", "Votre session avec {name} est terminée.", {
        name: attendee.name,
      })}
      callToAction={
        <a
          href={addSummaryLink}
          style={{
            backgroundColor: "#FF6B35", // Thotis Orange
            color: "#FFFFFF",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            display: "inline-block",
          }}>
          {t("thotis_add_summary", "Rédiger le résumé")}
        </a>
      }>
      {t(
        "thotis_mentor_nudge_body",
        "Merci d'avoir partagé votre expérience avec {name}. Prenez 2 minutes pour rédiger un court résumé et partager des ressources utiles. Cela aide énormément l'étudiant à avancer.",
        { name: attendee.name }
      )}
    </ThotisBaseEmail>
  );
};

export default MentorNudgeEmail;
