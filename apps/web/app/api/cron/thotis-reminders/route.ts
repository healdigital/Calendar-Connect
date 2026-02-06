import dayjs from "@calcom/dayjs";
import { AnalyticsService } from "@calcom/features/thotis/services/AnalyticsService";
import { ThotisEmailService } from "@calcom/features/thotis/services/ThotisEmailService";
import { getTranslation } from "@calcom/lib/server/i18n";
import prisma from "@calcom/prisma";
import type { CalendarEvent } from "@calcom/types/Calendar";
import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.nextUrl.searchParams.get("apiKey");

  if (authHeader !== `Bearer ${CRON_SECRET}` && apiKey !== CRON_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const analytics = new AnalyticsService();
  const thotisEmail = new ThotisEmailService();

  const now = dayjs();
  // Reminders exactly 24 hours before (window: starts in 23h30m to 24h30m)
  const windowStart = now.add(23, "hour").add(30, "minute");
  const windowEnd = now.add(24, "hour").add(30, "minute");

  const bookings = await prisma.booking.findMany({
    where: {
      status: "PENDING", // In Thotis, sessions stay PENDING until completed
      startTime: {
        gte: windowStart.toDate(),
        lte: windowEnd.toDate(),
      },
      metadata: {
        path: ["isThotisSession"],
        equals: true,
      },
      NOT: {
        metadata: {
          path: ["reminder24hSent"],
          equals: true,
        },
      },
    },
    include: {
      user: true, // Mentor (host)
      attendees: true, // Prospective student (booker)
    },
  });

  let sentCount = 0;

  for (const booking of bookings) {
    try {
      const metadata = (booking.metadata as Record<string, unknown>) || {};
      const mentor = booking.user;

      if (!mentor) continue;

      const tMentor = await getTranslation(mentor.locale || "en", "common");

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
          language: { translate: tMentor, locale: mentor.locale || "en" },
        },
        attendees: booking.attendees.map((a) => ({
          name: a.name,
          email: a.email,
          timeZone: a.timeZone,
          language: { translate: tMentor, locale: a.locale || "en" }, // Approximate
        })),
        location: (metadata.googleMeetLink as string) || "",
        uid: booking.uid,
      };

      // 1. Send to Mentor
      await thotisEmail.sendReminder(calEvent, {
        name: mentor.name || "Mentor",
        email: mentor.email,
        timeZone: mentor.timeZone,
        language: { translate: tMentor, locale: mentor.locale || "en" },
      });

      // 2. Send to Student (attendee)
      for (const attendee of calEvent.attendees) {
        await thotisEmail.sendReminder(calEvent, attendee);
      }

      // 3. Log to Mixpanel
      analytics.trackBookingReminderSent({
        id: booking.id,
        userId: mentor.id,
        metadata: booking.metadata,
      });

      // Trigger Webhook
      const { thotisWebhooks } = await import("../../../lib/webhooks/thotis");
      await thotisWebhooks.onReminder(booking as unknown as any, "24h");

      // 4. Mark as sent
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          metadata: {
            ...metadata,
            reminder24hSent: true,
          } as Prisma.InputJsonValue,
        },
      });

      sentCount++;
    } catch (error) {
      console.error(`Failed to send reminder for booking ${booking.id}`, error);
    }
  }

  return NextResponse.json({ success: true, sentCount });
}
