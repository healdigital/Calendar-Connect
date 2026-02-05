import type { PrismaClient } from "@calcom/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { thotisRouter } from "./thotis";

// Mock dependencies
vi.mock("@calcom/features/thotis/services/ProfileService");
vi.mock("@calcom/features/thotis/services/ThotisBookingService");
vi.mock("@calcom/features/thotis/services/StatisticsService");
vi.mock("@calcom/features/thotis/repositories/ProfileRepository");
vi.mock("@calcom/features/thotis/repositories/SessionRatingRepository");
vi.mock("@calcom/prisma", () => {
  const mockPrisma = {
    booking: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    studentProfile: {
      findMany: vi.fn(),
    },
    sessionRating: {
      findUnique: vi.fn(),
    },
  };
  return {
    default: mockPrisma,
    prisma: mockPrisma,
  };
});

// Import mocked classes to set up return values
import { ThotisBookingService } from "@calcom/features/thotis/services/ThotisBookingService";

describe("thotisRouter - Public Sessions", () => {
  let mockCtx: any;
  let caller: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // PUBLIC context (no user)
    mockCtx = {
      user: undefined,
      session: undefined,
      prisma: {} as PrismaClient,
    };

    // Create caller
    // @ts-expect-error - casting context
    caller = thotisRouter.createCaller(mockCtx);
  });

  describe("studentSessions (Public)", () => {
    it("should allow getting sessions via email as a guest", async () => {
      const email = "guest@example.com";
      const mockBookings = [{ id: 1, title: "Test Session" }];

      const prisma = (await import("@calcom/prisma")).default;
      vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);

      const result = await caller.booking.studentSessions({ email, status: "upcoming" });

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            responses: {
              path: ["email"],
              equals: email,
            },
          }),
        })
      );
      expect(result).toEqual(mockBookings);
    });

    it("should throw error if no email is provided as guest", async () => {
      await expect(caller.booking.studentSessions({ status: "upcoming" })).rejects.toThrow(
        "User email not found"
      );
    });
  });

  describe("cancelSession (Public)", () => {
    it("should allow guest to cancel session with matching email", async () => {
      const input = {
        bookingId: 123,
        reason: "Can't make it",
        cancelledBy: "student" as const,
        email: "guest@example.com",
      };

      vi.mocked(ThotisBookingService.prototype.cancelSession).mockResolvedValue(undefined);

      await caller.booking.cancelSession(input);

      expect(ThotisBookingService.prototype.cancelSession).toHaveBeenCalledWith(
        input.bookingId,
        input.reason,
        input.cancelledBy,
        { email: input.email }
      );
    });

    it("should throw error if neither auth nor email is provided", async () => {
      const input = {
        bookingId: 123,
        reason: "Can't make it",
        cancelledBy: "student" as const,
      };

      await expect(caller.booking.cancelSession(input)).rejects.toThrow("Authentication or email required");
    });
  });

  describe("rescheduleSession (Public)", () => {
    it("should allow guest to reschedule session with matching email", async () => {
      const input = {
        bookingId: 123,
        newDateTime: new Date(),
        email: "guest@example.com",
      };

      const mockResponse = {
        bookingId: 123,
        googleMeetLink: "link",
        calendarEventId: "evt",
        confirmationSent: true,
      };
      vi.mocked(ThotisBookingService.prototype.rescheduleSession).mockResolvedValue(mockResponse);

      const result = await caller.booking.rescheduleSession(input);

      expect(ThotisBookingService.prototype.rescheduleSession).toHaveBeenCalledWith(
        input.bookingId,
        input.newDateTime,
        { email: input.email }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
