import process from "node:process";
import { BookingRepository } from "@calcom/features/bookings/repositories/BookingRepository";
import { DefaultAdapterFactory } from "@calcom/features/calendar-subscription/adapters/AdaptersFactory";
import { CalendarSubscriptionService } from "@calcom/features/calendar-subscription/lib/CalendarSubscriptionService";
import { CalendarCacheEventRepository } from "@calcom/features/calendar-subscription/lib/cache/CalendarCacheEventRepository";
import { CalendarCacheEventService } from "@calcom/features/calendar-subscription/lib/cache/CalendarCacheEventService";
import { CalendarSyncService } from "@calcom/features/calendar-subscription/lib/sync/CalendarSyncService";
import { FeaturesRepository } from "@calcom/features/flags/features.repository";
import { SelectedCalendarRepository } from "@calcom/features/selectedCalendar/repositories/SelectedCalendarRepository";
import prisma from "@calcom/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.nextUrl.searchParams.get("apiKey");

  if (!CRON_SECRET) {
    return NextResponse.json({ message: "Misconfigured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${CRON_SECRET}` && apiKey !== CRON_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 1. Get all active mentors
  const activeMentors = await prisma.studentProfile.findMany({
    where: { isActive: true },
    select: { userId: true },
  });

  const mentorUserIds = activeMentors.map((m) => m.userId);

  if (mentorUserIds.length === 0) {
    return NextResponse.json({ success: true, syncedCount: 0 });
  }

  // 2. Get their selected calendars
  const selectedCalendars = await prisma.selectedCalendar.findMany({
    where: {
      userId: { in: mentorUserIds },
    },
  });

  // 3. Initialize CalendarSubscriptionService
  const bookingRepository = new BookingRepository(prisma);
  const calendarSyncService = new CalendarSyncService({
    bookingRepository,
  });
  const calendarCacheEventRepository = new CalendarCacheEventRepository(prisma);
  const calendarCacheEventService = new CalendarCacheEventService({
    calendarCacheEventRepository,
  });

  const calendarSubscriptionService = new CalendarSubscriptionService({
    adapterFactory: new DefaultAdapterFactory(),
    selectedCalendarRepository: new SelectedCalendarRepository(prisma),
    featuresRepository: new FeaturesRepository(prisma),
    calendarSyncService,
    calendarCacheEventService,
  });

  let syncedCount = 0;
  let errorCount = 0;

  // 4. Process events (sync) for each selected calendar
  for (const sc of selectedCalendars) {
    try {
      await calendarSubscriptionService.processEvents(sc);
      syncedCount++;
    } catch (error) {
      console.error(`Failed to sync calendar ${sc.id} for user ${sc.userId}`, error);
      errorCount++;
    }
  }

  return NextResponse.json({ success: true, syncedCount, errorCount });
}
