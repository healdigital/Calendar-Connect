import { ThotisBaseEmail } from "./ThotisBaseEmail";

export const FeedbackRequestEmail = (
  props: {
    calEvent: CalendarEvent;
    attendee: Person;
    feedbackLink: string;
  } & Partial<React.ComponentProps<typeof ThotisBaseEmail>>
) => {
  const { translate: t } = props.attendee.language;
  return (
    <ThotisBaseEmail
      hideLogo={Boolean(props.calEvent.platformClientId)}
      headerType="checkCircle"
      subject={t("thotis_feedback_request_subject", "How was your session with {{name}}?", {
        name: props.calEvent.organizer.name,
      })}
      title={t("thotis_feedback_request_title", "Your session recap is available")}
      subtitle={t("thotis_feedback_request_subtitle", "Was this session useful to you?")}>
      <div style={{ marginBottom: "20px" }}>
        <p>{t("thotis_feedback_request_body", { name: props.attendee.name })}</p>
      </div>

      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <a
          href={props.feedbackLink}
          style={{
            backgroundColor: "#FF6B35", // Thotis Orange
            color: "#FFFFFF",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            fontFamily: "Montserrat, Inter, Roboto, sans-serif",
            fontSize: "16px",
            display: "inline-block",
          }}>
          {t("thotis_view_recap", "Voir le récapitulatif")}
        </a>
      </div>
    </ThotisBaseEmail>
  );
};
