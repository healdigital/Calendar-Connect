import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import renderEmail from "../../src/renderEmail";
import AttendeeScheduledEmail from "../attendee-scheduled-email";

export default class BookingCancellationEmail extends AttendeeScheduledEmail {
  constructor(calEvent: CalendarEvent, attendee: Person, showAttendees?: boolean | undefined) {
    super(calEvent, attendee, showAttendees);
    this.name = "SEND_BOOKING_CANCELLATION";
  }

  public async getHtml(calEvent: CalendarEvent, attendee: Person) {
    return await renderEmail("BookingCancellationEmail", {
      calEvent,
      attendee,
    });
  }
}
