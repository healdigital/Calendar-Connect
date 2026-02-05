import prisma from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma/client";
import { ThotisAnalyticsEventType } from "@calcom/prisma/enums";

export class AnalyticsRepository {
  private prismaClient: PrismaClient;

  constructor(deps?: { prismaClient?: PrismaClient }) {
    this.prismaClient = deps?.prismaClient || prisma;
  }

  async trackEvent(data: {
    eventType: ThotisAnalyticsEventType;
    userId?: number;
    guestId?: string;
    profileId?: string;
    bookingId?: number;
    field?: string;
    source?: string;
    metadata?: any;
  }) {
    return this.prismaClient.thotisAnalyticsEvent.create({
      data: {
        eventType: data.eventType,
        userId: data.userId,
        guestId: data.guestId,
        profileId: data.profileId,
        bookingId: data.bookingId,
        field: data.field,
        source: data.source,
        metadata: data.metadata || {},
      },
    });
  }

  async getFunnelStats(period: "daily" | "weekly" | "monthly" = "monthly") {
    // Basic funnel aggregation: profile_viewed -> booking_started -> booking_confirmed -> session_completed
    const events = await this.prismaClient.thotisAnalyticsEvent.findMany({
      where: {
        eventType: {
          in: [
            ThotisAnalyticsEventType.profile_viewed,
            ThotisAnalyticsEventType.booking_started,
            ThotisAnalyticsEventType.booking_confirmed,
            ThotisAnalyticsEventType.session_completed,
          ],
        },
      },
      select: {
        eventType: true,
        createdAt: true,
      },
    });

    const funnel = {
      profile_viewed: 0,
      booking_started: 0,
      booking_confirmed: 0,
      session_completed: 0,
    };

    events.forEach((e) => {
      if (e.eventType in funnel) {
        funnel[e.eventType as keyof typeof funnel]++;
      }
    });

    return funnel;
  }

  async getConversionByField() {
    return this.prismaClient.thotisAnalyticsEvent.groupBy({
      by: ["field", "eventType"],
      _count: {
        id: true,
      },
      where: {
        field: { not: null },
      },
    });
  }
}
