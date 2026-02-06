import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThotisBookingService } from "./ThotisBookingService";

// Pre-create the mock service
const mockAvailableSlotsService = {
  getAvailableSlots: vi.fn(),
};

// Mock the AvailableSlots container
vi.mock("@calcom/features/di/containers/AvailableSlots", () => ({
  getAvailableSlotsService: vi.fn(() => mockAvailableSlotsService),
}));

// Mock dependencies
const prismaMock = {
  studentProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  booking: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  eventType: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  credential: {
    findMany: vi.fn(),
  },
  mentorQualityIncident: {
    create: vi.fn(),
  },
} as any;

const analyticsMock = {
  trackBookingCreated: vi.fn(),
  trackBookingCancelled: vi.fn(),
  trackBookingRescheduled: vi.fn(),
} as any;

describe("ThotisBookingService Unit Tests", () => {
  let service: ThotisBookingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ThotisBookingService(prismaMock, analyticsMock);
  });

  describe("ensureVideoLink", () => {
    it("should return existing link if valid", async () => {
      // @ts-expect-error - accessing private method for test
      const link = await service.ensureVideoLink(1, "uid", "https://meet.google.com/abc", {});
      expect(link).toBe("https://meet.google.com/abc");
      expect(prismaMock.booking.update).not.toHaveBeenCalled();
    });

    it("should generate Jitsi fallback if link is placeholder", async () => {
      // @ts-expect-error - accessing private method for test
      const link = await service.ensureVideoLink(1, "test-uid", "integrations:google-video", {});
      expect(link).toBe("https://meet.jit.si/thotis-test-uid");
      expect(prismaMock.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            location: "https://meet.jit.si/thotis-test-uid",
          }),
        })
      );
    });
  });

  describe("cancelSession", () => {
    it("should prevent cancellation if notice is less than 2 hours", async () => {
      const now = new Date();
      const booking = {
        id: 1,
        startTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 mins from now
        status: "PENDING",
        eventType: { userId: 1, minimumBookingNotice: 120 },
        metadata: { studentProfileId: "sp1" },
      };
      prismaMock.booking.findUnique.mockResolvedValue(booking);

      await expect(service.cancelSession(1, "reason", "student", { id: 1 })).rejects.toThrow(
        "Bookings must be cancelled at least 120 minutes in advance"
      );
    });
  });

  describe("markSessionAsNoShow", () => {
    it("should mark session as CANCELLED and create an incident", async () => {
      const now = new Date();
      const booking = {
        id: 1,
        uid: "test-uid",
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: new Date(now.getTime() - 15 * 60 * 1000),
        status: "PENDING",
        metadata: { studentProfileId: "sp1" },
        userId: 1,
        responses: { email: "student@example.com" },
      };
      prismaMock.booking.findUnique.mockResolvedValue(booking);
      prismaMock.studentProfile.findUnique.mockResolvedValue({ userId: 1 });

      await service.markSessionAsNoShow(1, { isSystem: true });

      expect(prismaMock.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: "CANCELLED",
            cancellationReason: "no_show_auto",
          }),
        })
      );

      expect(prismaMock.mentorQualityIncident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentProfileId: "sp1",
            type: "NO_SHOW", // Using literal since it's hard to import MentorIncidentType in test mock easily without complex setup
          }),
        })
      );

      expect(prismaMock.studentProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sp1" },
          data: expect.objectContaining({
            cancelledSessions: { increment: 1 },
          }),
        })
      );
    });
  });

  describe("createStudentSession availability", () => {
    it("should throw conflict if mentor is not available in engine", async () => {
      const dateTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
      prismaMock.studentProfile.findUnique.mockResolvedValue({
        id: "sp1",
        userId: 1,
        status: "VERIFIED",
        user: { studentProfile: { field: "math" } },
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, username: "mentor" });
      prismaMock.eventType.findFirst.mockResolvedValue({ id: 101, length: 15 });

      // Mock engine reporting slot as unavailable (empty slots)
      mockAvailableSlotsService.getAvailableSlots.mockResolvedValue({ slots: {} });

      await expect(
        service.createStudentSession({
          studentProfileId: "sp1",
          dateTime,
          prospectiveStudent: { name: "Student", email: "student@example.com" },
        })
      ).rejects.toThrow(/Mentor is not available/);
    });
  });

  describe("rescheduleSession availability", () => {
    it("should throw conflict if new slot is unavailable in engine", async () => {
      const now = new Date();
      const newDateTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
      const booking = {
        id: 1,
        userId: 1,
        startTime: now,
        status: "PENDING",
        eventType: { userId: 1 },
      };
      prismaMock.booking.findUnique.mockResolvedValue(booking);
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, username: "mentor" });
      prismaMock.eventType.findFirst.mockResolvedValue({ id: 101, length: 15 });
      prismaMock.booking.findFirst.mockResolvedValue(null); // No internal conflicts

      // Mock engine reporting slot as unavailable
      mockAvailableSlotsService.getAvailableSlots.mockResolvedValue({ slots: {} });

      await expect(service.rescheduleSession(1, newDateTime, { id: 1 })).rejects.toThrow(
        /Mentor is not available/
      );
    });
  });
});
