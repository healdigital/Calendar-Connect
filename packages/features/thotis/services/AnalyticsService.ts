import process from "node:process";
import Mixpanel from "mixpanel";

export class AnalyticsService {
  private mixpanel: Mixpanel.Mixpanel | null = null;
  private readonly enabled: boolean;

  constructor() {
    const token = process.env.MIXPANEL_TOKEN;
    this.enabled = !!token;
    if (this.enabled && token) {
      this.mixpanel = Mixpanel.init(token);
    }
  }

  private track(eventName: string, distinctId: string, properties: Record<string, unknown> = {}) {
    if (!this.enabled || !this.mixpanel) return;

    try {
      this.mixpanel.track(eventName, {
        distinct_id: distinctId,
        ...properties,
        timestamp: new Date(),
      });
    } catch (error) {
      console.warn(`Failed to track event ${eventName}`, error);
    }
  }

  trackProfileCreated(profile: { userId: number; field: string; university: string; degree: string }) {
    this.track("profile_created", profile.userId.toString(), {
      field: profile.field,
      university: profile.university,
      degree: profile.degree,
    });
  }

  trackBookingCreated(
    booking: {
      id: number;
      userId: number | null; // Student/Mentor ID
      startTime: Date;
      endTime: Date;
      metadata: unknown;
    },
    prospectiveStudentEmail: string
  ) {
    const metadata = (booking.metadata as Record<string, unknown>) || {};
    this.track("booking_created", prospectiveStudentEmail, {
      booking_id: booking.id,
      mentor_id: booking.userId,
      start_time: booking.startTime,
      end_time: booking.endTime,
      student_profile_id: metadata.studentProfileId,
    });
  }

  trackBookingCancelled(
    booking: {
      id: number;
      userId: number | null;
      metadata: unknown;
    },
    reason: string,
    cancelledBy: "mentor" | "student" | "system"
  ) {
    const metadata = (booking.metadata as Record<string, unknown>) || {};
    const prospectiveStudentEmail = (metadata.prospectiveStudentEmail as string) || "unknown";

    this.track("booking_cancelled", prospectiveStudentEmail, {
      booking_id: booking.id,
      mentor_id: booking.userId,
      reason,
      cancelled_by: cancelledBy,
      student_profile_id: metadata.studentProfileId,
    });
  }

  trackBookingCompleted(booking: { id: number; userId: number | null; metadata: unknown }) {
    const metadata = (booking.metadata as Record<string, unknown>) || {};
    const prospectiveStudentEmail = (metadata.prospectiveStudentEmail as string) || "unknown";

    this.track("booking_completed", prospectiveStudentEmail, {
      booking_id: booking.id,
      mentor_id: booking.userId,
      student_profile_id: metadata.studentProfileId,
    });
  }

  trackBookingReminderSent(booking: { id: number; userId: number | null; metadata: unknown }) {
    const metadata = (booking.metadata as Record<string, unknown>) || {};
    const prospectiveStudentEmail = (metadata.prospectiveStudentEmail as string) || "unknown";

    this.track("booking_reminder_sent", prospectiveStudentEmail, {
      booking_id: booking.id,
      mentor_id: booking.userId,
      student_profile_id: metadata.studentProfileId,
    });
  }

  trackFeedbackRequestSent(booking: { id: number; userId: number | null; metadata: unknown }) {
    const metadata = (booking.metadata as Record<string, unknown>) || {};
    const prospectiveStudentEmail = (metadata.prospectiveStudentEmail as string) || "unknown";

    this.track("feedback_request_sent", prospectiveStudentEmail, {
      booking_id: booking.id,
      mentor_id: booking.userId,
      student_profile_id: metadata.studentProfileId,
    });
  }

  trackRatingSubmitted(
    rating: {
      id: number;
      bookingId: number;
      studentProfileId: number;
      rating: number;
      feedback: string | null;
    },
    session: {
      metadata: unknown;
    }
  ) {
    const metadata = (session.metadata as Record<string, unknown>) || {};
    const prospectiveStudentEmail = (metadata.prospectiveStudentEmail as string) || "unknown";

    this.track("rating_submitted", prospectiveStudentEmail, {
      rating_id: rating.id,
      booking_id: rating.bookingId,
      mentor_id: rating.studentProfileId,
      rating_value: rating.rating,
      has_feedback: !!rating.feedback,
      feedback_length: rating.feedback?.length || 0,
    });
  }
}
