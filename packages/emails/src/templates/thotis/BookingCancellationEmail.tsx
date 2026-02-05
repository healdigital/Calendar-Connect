import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import { ThotisBaseScheduledEmail } from "./ThotisBaseScheduledEmail";

export const BookingCancellationEmail = (
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
      title="booking_cancelled"
      subtitle="booking_cancelled_subtitle"
      headerType="xCircle"
      {...props}
    />
  );
};
