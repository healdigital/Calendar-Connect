import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import renderEmail from "../../src/renderEmail";
import BaseEmail from "../_base-email";

export default class FeedbackRequestEmail extends BaseEmail {
  calEvent: CalendarEvent;
  attendee: Person;
  feedbackLink: string;

  constructor(calEvent: CalendarEvent, attendee: Person, feedbackLink: string) {
    super();
    this.calEvent = calEvent;
    this.attendee = attendee;
    this.feedbackLink = feedbackLink;
    this.name = "SEND_FEEDBACK_REQUEST";
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: `${this.attendee.name} <${this.attendee.email}>`,
      from: `${this.calEvent.organizer.name} <${this.getMailerOptions().from}>`,
      subject: this.calEvent.title,
      html: await this.getHtml(this.calEvent, this.attendee, this.feedbackLink),
      text: "", // Needed but simple
    };
  }

  protected async getHtml(calEvent: CalendarEvent, attendee: Person, feedbackLink: string) {
    return await renderEmail("FeedbackRequestEmail", {
      calEvent,
      attendee,
      feedbackLink: feedbackLink,
    });
  }
}
