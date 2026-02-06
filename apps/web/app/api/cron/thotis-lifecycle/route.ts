import process from "node:process";
import { AnalyticsRepository } from "@calcom/features/thotis/repositories/AnalyticsRepository";
import { ThotisAnalyticsService } from "@calcom/features/thotis/services/ThotisAnalyticsService";
import { ThotisBookingService } from "@calcom/features/thotis/services/ThotisBookingService";
import prisma from "@calcom/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";

/**
 * Thotis Session Lifecycle Cron
 * Automatically marks sessions as complete 15 minutes after end time.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.nextUrl.searchParams.get("apiKey");

  if (authHeader !== `Bearer ${CRON_SECRET}` && apiKey !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analyticsRepository = new AnalyticsRepository();
  const thotisAnalytics = new ThotisAnalyticsService(analyticsRepository);
  const bookingService = new ThotisBookingService(prisma, undefined, undefined, thotisAnalytics);

  const now = new Date();
  // Buffer of 15 minutes + 5 minutes to ensure we don't complete too early or miss execution
  // Actually, we just need to find sessions that ended > 15 minutes ago
  // and are not yet marked as 'ACCEPTED' (completed) or are PENDING.
  // In Thotis flow, active sessions are 'PENDING'. Completed are 'ACCEPTED'.
  // This is a bit unusual for Cal.com but that's how we set it up.

  // Wait, in createStudentSession we set status: "PENDING".
  // In markSessionComplete, we set status: "ACCEPTED" and metadata.completedAt.

  // So we look for PENDING bookings where endTime < (now - 15 minutes).
  const completionThreshold = new Date(now.getTime() - 15 * 60 * 1000);

  const pendingBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      endTime: {
        lte: completionThreshold,
      },
      metadata: {
        path: ["isThotisSession"],
        equals: true,
      },
    },
    select: {
      id: true,
    },
    take: 50, // Process in batches
  });

  const results = {
    processed: 0,
    errors: 0,
    ids: [] as number[],
  };

  for (const booking of pendingBookings) {
    try {
      // If a session is still PENDING 15 minutes after end time, it's a No-Show
      await bookingService.markSessionAsNoShow(booking.id, { isSystem: true });
      results.processed++;
      results.ids.push(booking.id);
    } catch (error) {
      console.error(`Failed to record no-show for session ${booking.id}`, error);
      results.errors++;
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
  });
}
