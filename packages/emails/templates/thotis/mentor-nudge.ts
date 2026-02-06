import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import renderEmail from "../../src/renderEmail";
import AttendeeScheduledEmail from "../attendee-scheduled-email";

export default class MentorNudgeEmail extends AttendeeScheduledEmail {
  addSummaryLink: string;

  constructor(args: { calEvent: CalendarEvent; attendee: Person; addSummaryLink: string }) {
    super(args.calEvent, args.attendee);
    this.name = "SEND_MENTOR_NUDGE";
    this.addSummaryLink = args.addSummaryLink;
  }

  public async getHtml(calEvent: CalendarEvent, attendee: Person) {
    return await renderEmail("MentorNudgeEmail", {
      calEvent,
      attendee,
      addSummaryLink: this.addSummaryLink,
    });
  }
}
