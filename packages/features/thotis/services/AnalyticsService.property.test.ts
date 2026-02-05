import Mixpanel from "mixpanel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsService } from "./AnalyticsService";

// Mock Mixpanel
const { mockInit, mockTrack } = vi.hoisted(() => {
  const mockTrack = vi.fn();
  const mockInit = vi.fn(() => ({
    track: mockTrack,
  }));
  return { mockInit, mockTrack };
});

vi.mock("mixpanel", () => ({
  default: {
    init: mockInit,
  },
}));

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    vi.stubEnv("MIXPANEL_TOKEN", "test-token");
    vi.clearAllMocks();
    service = new AnalyticsService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should initialize Mixpanel with token", () => {
    expect(mockInit).toHaveBeenCalledWith("test-token");
  });

  it("should track profile_created event", () => {
    const profile = {
      userId: 123,
      field: "Computer Science",
      university: "MIT",
      degree: "B.Sc.",
    };

    service.trackProfileCreated(profile);

    expect(mockTrack).toHaveBeenCalledWith(
      "profile_created",
      expect.objectContaining({
        distinct_id: "123",
        field: "Computer Science",
        university: "MIT",
        degree: "B.Sc.",
      })
    );
  });

  it("should track booking_created event", () => {
    const booking = {
      id: 456,
      userId: 123, // Mentor
      startTime: new Date("2023-01-01T10:00:00Z"),
      endTime: new Date("2023-01-01T10:15:00Z"),
      metadata: {
        studentProfileId: "profile-123",
      },
    };
    const prospectiveStudentEmail = "student@example.com";

    service.trackBookingCreated(booking, prospectiveStudentEmail);

    expect(mockTrack).toHaveBeenCalledWith(
      "booking_created",
      expect.objectContaining({
        distinct_id: "student@example.com",
        booking_id: 456,
        mentor_id: 123,
        start_time: booking.startTime,
        end_time: booking.endTime,
        student_profile_id: "profile-123",
      })
    );
  });

  it("should track booking_cancelled event", () => {
    const booking = {
      id: 456,
      userId: 123,
      metadata: {
        studentProfileId: "profile-123",
        prospectiveStudentEmail: "student@example.com",
      },
    };
    const reason = "Scheduling conflict";
    const cancelledBy = "mentor";

    service.trackBookingCancelled(booking, reason, cancelledBy);

    expect(mockTrack).toHaveBeenCalledWith(
      "booking_cancelled",
      expect.objectContaining({
        distinct_id: "student@example.com",
        booking_id: 456,
        mentor_id: 123,
        reason: "Scheduling conflict",
        cancelled_by: "mentor",
        student_profile_id: "profile-123",
      })
    );
  });

  it("should track booking_completed event", () => {
    const booking = {
      id: 456,
      userId: 123,
      metadata: {
        studentProfileId: "profile-123",
        prospectiveStudentEmail: "student@example.com",
      },
    };

    service.trackBookingCompleted(booking);

    expect(mockTrack).toHaveBeenCalledWith(
      "booking_completed",
      expect.objectContaining({
        distinct_id: "student@example.com",
        booking_id: 456,
        mentor_id: 123,
        student_profile_id: "profile-123",
      })
    );
  });

  it("should track rating_submitted event", () => {
    const rating = {
      id: 789,
      bookingId: 456,
      studentProfileId: 101,
      rating: 5,
      feedback: "Great session!",
    };
    const session = {
      metadata: {
        prospectiveStudentEmail: "student@example.com",
      },
    };

    service.trackRatingSubmitted(rating, session);

    expect(mockTrack).toHaveBeenCalledWith(
      "rating_submitted",
      expect.objectContaining({
        distinct_id: "student@example.com",
        rating_id: 789,
        booking_id: 456,
        mentor_id: 101, // studentProfileId matches
        rating_value: 5,
        has_feedback: true,
        feedback_length: 14,
      })
    );
  });

  it("should not track if Mixpanel token is missing", () => {
    vi.stubEnv("MIXPANEL_TOKEN", "");
    const serviceWithoutToken = new AnalyticsService();

    serviceWithoutToken.trackProfileCreated({
      userId: 111,
      field: "Arts",
      university: "Yale",
      degree: "BA",
    });

    expect(mockTrack).not.toHaveBeenCalled();
  });
});
