import { ErrorCode } from "@calcom/lib/errorCodes";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThotisBookingService } from "./ThotisBookingService";

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
});
