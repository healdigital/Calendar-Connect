import { readFileSync } from "node:fs";
// prismock needs the DMMF to work correctly
import { getDMMF } from "@prisma/internals";
import { createPrismock } from "prismock/build/main/lib/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RedisService } from "../../redis/RedisService";
import type { AnalyticsService } from "./AnalyticsService";
import { ThotisBookingService } from "./ThotisBookingService";

let prismock: any;

async function getPrismock() {
  const schemaPath = "packages/prisma/schema.prisma";
  const schemaContent = readFileSync(schemaPath, "utf-8");
  const dmmf = await getDMMF({ datamodel: schemaContent });
  const PrismockClient = createPrismock({ dmmf } as any);
  return new PrismockClient();
}

// Helper to generate unique identifiers per test
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Store cleanup functions to ensure they run even if tests fail
const cleanupFunctions: Array<() => Promise<void>> = [];

afterEach(async () => {
  for (const cleanup of cleanupFunctions) {
    await cleanup();
  }
  cleanupFunctions.length = 0;
});

async function setup() {
  const id = uniqueId();

  if (!prismock) {
    prismock = await getPrismock();
  } else {
    prismock.reset();
  }

  // Create test mentor user
  const mentorUser = await prismock.user.create({
    data: {
      email: `mentor-${id}@example.com`,
      username: `mentor-${id}`,
      name: `Test Mentor ${id}`,
    },
  });

  // Create student profile
  const studentProfile = await prismock.studentProfile.create({
    data: {
      userId: mentorUser.id,
      university: "Test University",
      degree: "Test Degree",
      field: "COMPUTER_SCIENCE" as any,
      year: 3,
      bio: "Test Bio",
      isActive: true,
    },
  });

  // Mock services
  const analyticsMock = {
    trackBookingCreated: vi.fn(),
    trackBookingCancelled: vi.fn(),
    trackBookingRescheduled: vi.fn(),
    trackBookingCompleted: vi.fn(),
  } as unknown as AnalyticsService;

  const redisMock = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  } as unknown as RedisService;

  const service = new ThotisBookingService(prismock, analyticsMock, redisMock);

  const cleanup = async () => {
    // Prismock reset handles this
  };

  cleanupFunctions.push(cleanup);

  return { mentorUser, studentProfile, service, analyticsMock, redisMock };
}

describe("ThotisBookingService Integration Tests", () => {
  it("should complete a full booking flow", async () => {
    const { mentorUser, studentProfile, service, analyticsMock } = await setup();

    // 1. Availability check
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    start.setDate(start.getDate() + 1); // Tomorrow
    const end = new Date(start);
    end.setHours(12, 0, 0, 0);

    const slots = await service.getStudentAvailability(studentProfile.id, { start, end });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].available).toBe(true);

    // 2. Booking
    const bookingTime = slots[0].start;
    const bookingResult = await service.createStudentSession({
      studentProfileId: studentProfile.id,
      dateTime: bookingTime,
      prospectiveStudent: {
        name: "Prospective Student",
        email: "prospective@example.com",
        question: "How to learn integration testing?",
      },
    });

    expect(bookingResult.bookingId).toBeDefined();
    expect(bookingResult.googleMeetLink).toContain("https://meet.google.com/");
    expect(analyticsMock.trackBookingCreated).toHaveBeenCalled();

    // Verify in DB
    const bookingInDb = await prismock.booking.findUnique({
      where: { id: bookingResult.bookingId },
    });
    expect(bookingInDb).toBeDefined();
    expect(bookingInDb?.status).toBe("PENDING");

    // 3. Mark Complete
    const pastTime = new Date(Date.now() - 3600000); // 1 hour ago

    const pastBooking = await prismock.booking.create({
      data: {
        userId: mentorUser.id,
        startTime: new Date(pastTime),
        endTime: new Date(pastTime.getTime() + 15 * 60 * 1000),
        title: "Past Session",
        status: "PENDING",
        metadata: {
          isThotisSession: true,
          studentProfileId: studentProfile.id,
        },
      },
    });

    await service.markSessionComplete(pastBooking.id, { id: mentorUser.id });

    const completedBooking = await prismock.booking.findUnique({
      where: { id: pastBooking.id },
    });
    expect(completedBooking?.status).toBe("ACCEPTED");

    // Verify stats updated
    const updatedProfile = await prismock.studentProfile.findUnique({
      where: { id: studentProfile.id },
    });
    expect(updatedProfile?.completedSessions).toBe(1);
  });

  it("should handle booking -> cancellation flow", async () => {
    const { studentProfile, service, analyticsMock } = await setup();

    // Create a booking for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const bookingResult = await service.createStudentSession({
      studentProfileId: studentProfile.id,
      dateTime: tomorrow,
      prospectiveStudent: {
        name: "Prospective Student",
        email: "prospective@example.com",
      },
    });

    // Cancel it
    await service.cancelSession(bookingResult.bookingId, "Change of plans", "student", {
      email: "prospective@example.com",
    });

    const cancelledBooking = await prismock.booking.findUnique({
      where: { id: bookingResult.bookingId },
    });
    expect(cancelledBooking?.status).toBe("CANCELLED");
    expect(cancelledBooking?.cancellationReason).toBe("Change of plans");
    expect(analyticsMock.trackBookingCancelled).toHaveBeenCalled();

    // Verify stats
    const updatedProfile = await prismock.studentProfile.findUnique({
      where: { id: studentProfile.id },
    });
    expect(updatedProfile?.cancelledSessions).toBe(1);
  });

  it("should prevent double booking", async () => {
    const { studentProfile, service } = await setup();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    await service.createStudentSession({
      studentProfileId: studentProfile.id,
      dateTime: tomorrow,
      prospectiveStudent: { name: "S1", email: "s1@example.com" },
    });

    // Try to book same time
    await expect(
      service.createStudentSession({
        studentProfileId: studentProfile.id,
        dateTime: tomorrow,
        prospectiveStudent: { name: "S2", email: "s2@example.com" },
      })
    ).rejects.toThrow();
  });
});
