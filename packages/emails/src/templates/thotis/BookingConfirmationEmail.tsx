import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import { ThotisBaseScheduledEmail } from "./ThotisBaseScheduledEmail";

export const BookingConfirmationEmail = (
  props: {
    calEvent: CalendarEvent;
    attendee: Person;
  } & Partial<React.ComponentProps<typeof ThotisBaseScheduledEmail>>
) => {
  return (
    <ThotisBaseScheduledEmail
      locale={props.attendee.language.locale}
      timeZone={props.attendee.timeZone}
      t={props.attendee.language.translate}
      timeFormat={props.attendee?.timeFormat}
      title="booking_confirmed"
      subtitle="booking_confirmed_subtitle"
      headerType="checkCircle"
      {...props}
    />
  );
};
