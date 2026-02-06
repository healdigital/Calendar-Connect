import process from "node:process";
import FeedbackRequestEmail from "@calcom/emails/templates/thotis/feedback-request";
import prisma from "@calcom/prisma";
import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { TFunction } from "next-i18next";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.nextUrl.searchParams.get("apiKey");

  if (authHeader !== `Bearer ${CRON_SECRET}` && apiKey !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Find bookings that:
  // 1. Are Thotis sessions
  // 2. Are ACCEPTED (completed) or marked complete in metadata
  // 3. Ended between 24h and 48h ago
  // 4. Have not had feedback email sent yet
  const bookings = await prisma.booking.findMany({
    where: {
      endTime: {
        lt: twentyFourHoursAgo,
        gt: fortyEightHoursAgo,
      },
      OR: [
        { status: "ACCEPTED" },
        {
          metadata: {
            path: ["completedAt"],
            not: null,
          },
        },
      ],
      metadata: {
        path: ["isThotisSession"],
        equals: true,
      },
    },
    include: {
      eventType: true,
      user: true, // Mentor
      thotisSessionSummary: true,
    },
    take: 50,
  });

  const results = {
    processed: 0,
    errors: 0,
    ids: [] as number[],
  };

  const webAppUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || "https://app.cal.com";

  for (const booking of bookings) {
    try {
      const responses = booking.responses as { email?: string; name?: string } | null;
      const attendeeEmail = responses?.email;
      const attendeeName = responses?.name || "Student";

      if (!attendeeEmail) continue;

      const mentor = booking.user;
      if (!mentor) continue;

      // Construct minimalist objects for Email template
      const organizer: Person = {
        name: mentor.name || "Mentor",
        email: mentor.email,
        timeZone: mentor.timeZone || "Europe/Paris",
        language: { translate: ((key: string) => key) as TFunction, locale: mentor.locale || "fr" },
      };

      const attendee: Person = {
        name: attendeeName,
        email: attendeeEmail,
        timeZone: "Europe/Paris",
        language: { translate: ((key: string) => key) as TFunction, locale: "fr" },
      };

      const calEvent: CalendarEvent = {
        type: "thotis-mentoring",
        title: booking.title,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        organizer,
        attendees: [attendee],
        uid: booking.uid,
      };

      const metadata = (booking.metadata as Record<string, any>) || {};

      // 1. Nudge Mentor if no summary exists
      if (!booking.thotisSessionSummary && !metadata.mentorNudgeSent) {
        const { MentorNudgeEmail } = await import("@calcom/emails");
        const addSummaryLink = `${webAppUrl}/thotis/mentor-dashboard`;
        const email = new MentorNudgeEmail({ calEvent, attendee, addSummaryLink });
        await email.sendEmail();

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            metadata: {
              ...metadata,
              mentorNudgeSent: true,
              mentorNudgeSentAt: new Date().toISOString(),
            },
          },
        });
      }

      // 2. Send feedback email to student ONLY if summary exists (Nudge Student)
      if (booking.thotisSessionSummary && !metadata.feedbackEmailSent) {
        const { ThotisGuestService } = await import("@calcom/features/thotis/services/ThotisGuestService");
        const guestService = new ThotisGuestService();
        const { token } = await guestService.requestInboxLink(attendeeEmail, undefined, 1440);
        const feedbackLink = `${webAppUrl}/thotis/my-sessions?token=${token}`;

        const email = new FeedbackRequestEmail(calEvent, attendee, feedbackLink);
        await email.sendEmail();

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            metadata: {
              ...metadata,
              feedbackEmailSent: true,
              feedbackEmailSentAt: new Date().toISOString(),
            },
          },
        });
      }

      results.processed++;
      results.ids.push(booking.id);
    } catch (error) {
      console.error(`Failed to process booking ${booking.id}`, error);
      results.errors++;
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
  });
}

export const dynamic = "force-dynamic";
