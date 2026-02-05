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
      body={t(
        "thotis_mentor_nudge_body",
        "Merci d'avoir partagé votre expérience avec {name}. Prenez 2 minutes pour rédiger un court résumé et partager des ressources utiles. Cela aide énormément l'étudiant à avancer.",
        { name: attendee.name }
      )}
      callToAction={{
        label: t("thotis_add_summary", "Rédiger le résumé"),
        href: addSummaryLink,
      }}
    />
  );
};

export default MentorNudgeEmail;
