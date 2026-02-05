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

  async getFunnelData() {
    const rawFunnel = await this.repository.getFunnelStats();

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
      overall:
        rawFunnel.profile_viewed > 0 ? (rawFunnel.session_completed / rawFunnel.profile_viewed) * 100 : 0,
    };

    return {
      counts: rawFunnel,
      conversion,
    };
  }

  async getDataQualityMetrics() {
    // Placeholder for data quality checks
    // Requirements: bookings >= completed, no_show coherent with completion, etc.
    const funnel = await this.repository.getFunnelStats();

    // In a real scenario, we would query specific counts
    // For now, we derive basic consistency checks
    const issues = [];
    if (funnel.booking_confirmed < funnel.session_completed) {
      issues.push("Inconsistency: More sessions completed than confirmed bookings.");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
