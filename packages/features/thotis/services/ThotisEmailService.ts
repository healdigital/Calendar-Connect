import BookingConfirmationEmail from "@calcom/emails/templates/thotis/booking-confirmation";
import BookingReminderEmail from "@calcom/emails/templates/thotis/booking-reminder";
import FeedbackRequestEmail from "@calcom/emails/templates/thotis/feedback-request";
import type { CalendarEvent, Person } from "@calcom/types/Calendar";

export class ThotisEmailService {
  async sendReminder(calEvent: CalendarEvent, attendee: Person) {
    const email = new BookingReminderEmail(calEvent, attendee);
    await email.sendEmail();
  }

  async sendFeedbackRequest(calEvent: CalendarEvent, attendee: Person, feedbackLink: string) {
    const email = new FeedbackRequestEmail(calEvent, attendee, feedbackLink);
    await email.sendEmail();
  }

  async sendConfirmation(calEvent: CalendarEvent, attendee: Person) {
    const email = new BookingConfirmationEmail(calEvent, attendee);
    await email.sendEmail();
  }
}
