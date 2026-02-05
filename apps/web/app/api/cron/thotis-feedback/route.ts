import process from "node:process";
import dayjs from "@calcom/dayjs";
import { AnalyticsService } from "@calcom/features/thotis/services/AnalyticsService";
import { ThotisEmailService } from "@calcom/features/thotis/services/ThotisEmailService";
import { getTranslation } from "@calcom/lib/server/i18n";
import prisma from "@calcom/prisma";
import type { CalendarEvent } from "@calcom/types/Calendar";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET || "secret";
const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || "https://app.cal.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.nextUrl.searchParams.get("apiKey");

  if (authHeader !== `Bearer ${CRON_SECRET}` && apiKey !== CRON_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const analytics = new AnalyticsService();
  const thotisEmail = new ThotisEmailService();

  const now = dayjs();
  // Feedback requests for sessions that ended exactly 1 hour ago (window: ended 30m to 1h30m ago)
  const windowStart = now.subtract(1, "hour").subtract(30, "minute");
  const windowEnd = now.subtract(1, "hour").add(30, "minute");

  const bookings = await prisma.booking.findMany({
    where: {
      // Completed sessions in Thotis are marked as ACCEPTED (Cal.com convention) or PENDING but reached endTime.
      // Based on ThotisBookingService.markSessionComplete, status is set to ACCEPTED.
      // But a session might end without being manually marked.
      // Requirement 19.1: "Query completed bookings (1 hour after completion)"
      status: "ACCEPTED",
      endTime: {
        gte: windowStart.toDate(),
        lte: windowEnd.toDate(),
      },
      metadata: {
        path: ["isThotisSession"],
        equals: true,
      },
      NOT: {
        metadata: {
          path: ["feedbackRequestSent"],
          equals: true,
        },
      },
    },
    include: {
      user: true, // Mentor
      attendees: true, // Student
    },
  });

  let sentCount = 0;

  for (const booking of bookings) {
    try {
      const metadata = (booking.metadata as Record<string, unknown>) || {};
      const mentor = booking.user;

      if (!mentor || !booking.attendees[0]) continue;

      const student = booking.attendees[0];
      const tStudent = await getTranslation(student.locale || "en", "common");

      // Build CalendarEvent for emails
      const calEvent: CalendarEvent = {
        title: booking.title,
        type: booking.title,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        organizer: {
          id: mentor.id,
          name: mentor.name || "Mentor",
          email: mentor.email,
          timeZone: mentor.timeZone,
          language: { translate: tStudent, locale: student.locale || "en" },
        },
        attendees: [
          {
            name: student.name,
            email: student.email,
            timeZone: student.timeZone,
            language: { translate: tStudent, locale: student.locale || "en" },
          },
        ],
        location: (metadata.googleMeetLink as string) || "",
        uid: booking.uid,
      };

      // Generate feedback link
      const feedbackLink = `${WEBAPP_URL}/thotis/rate/${booking.uid}`;

      // Send Feedback Request Email to Student
      await thotisEmail.sendFeedbackRequest(calEvent, calEvent.attendees[0], feedbackLink);

      // Log to Mixpanel
      analytics.trackFeedbackRequestSent({
        id: booking.id,
        userId: mentor.id,
        metadata: booking.metadata,
      });

      // Mark as sent
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          metadata: {
            ...metadata,
            feedbackRequestSent: true,
          } as Prisma.InputJsonValue,
        },
      });

      sentCount++;
    } catch (error) {
      console.error(`Failed to send feedback request for booking ${booking.id}`, error);
    }
  }

  return NextResponse.json({ success: true, sentCount });
}
