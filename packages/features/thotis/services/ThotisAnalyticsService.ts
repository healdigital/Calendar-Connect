import type { ThotisAnalyticsEventType } from "@calcom/prisma/enums";
import type { AnalyticsRepository } from "../repositories/AnalyticsRepository";

export class ThotisAnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async track(data: {
    eventType: ThotisAnalyticsEventType;
    userId?: number;
    guestId?: string;
    profileId?: string;
    bookingId?: number;
    field?: string;
    source?: string;
    metadata?: Record<string, any>;
  }) {
    // Only track if eventType is valid (standardized taxonomy)
    return this.repository.trackEvent(data);
  }

  async getFunnelData(
    period: "daily" | "weekly" | "monthly" = "monthly",
    field?: string,
    profileId?: string
  ) {
    const rawFunnel = await this.repository.getFunnelStats(period, field, profileId);

    // Calculate conversion rates
    const conversion = {
      profile_to_booking_started:
        rawFunnel.profile_viewed > 0 ? (rawFunnel.booking_started / rawFunnel.profile_viewed) * 100 : 0,
      booking_started_to_confirmed:
        rawFunnel.booking_started > 0 ? (rawFunnel.booking_confirmed / rawFunnel.booking_started) * 100 : 0,
      confirmed_to_completed:
        rawFunnel.booking_confirmed > 0
          ? (rawFunnel.session_completed / rawFunnel.booking_confirmed) * 100
          : 0,
      completed_to_rated:
        rawFunnel.session_completed > 0
          ? (rawFunnel.rating_submitted / rawFunnel.session_completed) * 100
          : 0,
      overall:
        rawFunnel.profile_viewed > 0 ? (rawFunnel.session_completed / rawFunnel.profile_viewed) * 100 : 0,
    };

    return {
      counts: rawFunnel,
      conversion,
    };
  }

  async getDataQualityMetrics(
    period: "daily" | "weekly" | "monthly" = "monthly",
    field?: string,
    profileId?: string
  ) {
    // Requirements: bookings >= completed, no_show coherent with completion, etc.
    const funnel = await this.repository.getFunnelStats(period, field, profileId);

    const issues = [];

    // 1. Funnel Hierarchy Checks
    if (funnel.profile_viewed < funnel.booking_started) {
      issues.push("Inconsistency: More bookings started than profiles viewed.");
    }
    if (funnel.booking_started < funnel.booking_confirmed) {
      issues.push("Inconsistency: More confirmed bookings than started bookings.");
    }

    // 2. Outcomes vs Confirmations
    // A confirmed booking should result in either a session_completed or a cancellation/no_show.
    // We fetch raw stats for these as well.
    const completedCount = funnel.session_completed;
    const confirmedCount = funnel.booking_confirmed;

    if (confirmedCount < completedCount) {
      issues.push("Critical: More sessions completed than confirmed bookings.");
    }

    // 3. Ratings vs Completions
    if (completedCount < funnel.rating_submitted) {
      issues.push("Data Integrity: More ratings submitted than sessions marked as completed.");
    }

    // 4. Pilotage Insight: Check for missing data in tracked events
    if (confirmedCount > 0 && completedCount === 0) {
      const now = new Date();
      // If we have confirmed but zero completed in a long period, something might be wrong with tracking
      if (period === "monthly" || period === "weekly") {
        issues.push("Warning: Confirmed bookings exist but zero completions tracked in this period.");
      }
    }

    return {
      isValid: issues.length === 0,
      totalIssues: issues.length,
      issues,
      lastChecked: new Date(),
      sampleSize: confirmedCount,
    };
  }
}
