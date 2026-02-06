import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import { ThotisBaseScheduledEmail } from "./ThotisBaseScheduledEmail";

export const BookingConfirmationEmail = (
  props: {
    calEvent: CalendarEvent;
    attendee: Person;
    dashboardLink?: string;
  } & Partial<React.ComponentProps<typeof ThotisBaseScheduledEmail>>
) => {
  const { dashboardLink, ...rest } = props;
  return (
    <ThotisBaseScheduledEmail
      locale={props.attendee.language.locale}
      timeZone={props.attendee.timeZone}
      t={props.attendee.language.translate}
      timeFormat={props.attendee?.timeFormat}
      title="booking_confirmed"
      subtitle="booking_confirmed_subtitle"
      headerType="checkCircle"
      customMessage={
        props.dashboardLink ? (
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <p style={{ marginBottom: "15px", color: "#4B5563" }}>
              Pour gérer votre session ou voir vos autres rendez-vous :
            </p>
            <a
              href={props.dashboardLink}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#FF6B35",
                border: "1px solid #FF6B35",
                padding: "10px 20px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold",
                fontFamily: "Montserrat, Inter, Roboto, sans-serif",
                fontSize: "14px",
                display: "inline-block",
              }}>
              Accéder à mon espace invité
            </a>
          </div>
        ) : undefined
      }
      {...rest}
    />
  );
};
