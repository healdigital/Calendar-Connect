import type { PrismaClient } from "@calcom/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { thotisRouter } from "./thotis";

// Mock dependencies
vi.mock("@calcom/features/thotis/services/ProfileService");
vi.mock("@calcom/features/thotis/services/ThotisBookingService");
vi.mock("@calcom/features/thotis/services/ThotisGuestService");
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
import { ThotisGuestService } from "@calcom/features/thotis/services/ThotisGuestService";

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

  describe("guestRouter", () => {
    describe("getSessionsByToken", () => {
      it("should allow getting sessions via token as a guest", async () => {
        const token = "mock-token";
        const email = "guest@example.com";
        const mockBookings = [{ id: 1, title: "Test Session" }];
        const mockMagicLink = { guest: { email } };

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue(mockMagicLink as any);

        const prisma = (await import("@calcom/prisma")).default;
        vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);

        const result = await caller.guest.getSessionsByToken({ token, status: "upcoming" });

        expect(ThotisGuestService.prototype.verifyToken).toHaveBeenCalledWith(token);
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

      it("should filter by bookingId if the token is scoped", async () => {
        const token = "scoped-token";
        const bookingId = 123;
        const mockBookings = [{ id: bookingId, title: "Scoped Session" }];
        const mockMagicLink = { guest: { email: "guest@example.com" }, bookingId };

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue(mockMagicLink as any);

        const prisma = (await import("@calcom/prisma")).default;
        vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);

        const result = await caller.guest.getSessionsByToken({ token });

        expect(ThotisGuestService.prototype.verifyToken).toHaveBeenCalledWith(token);
        expect(prisma.booking.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              id: bookingId,
            }),
          })
        );
        expect(result).toEqual(mockBookings);
      });
    });

    describe("cancelByToken", () => {
      it("should allow guest to cancel session with valid token", async () => {
        const token = "mock-token";
        const email = "guest@example.com";
        const input = {
          bookingId: 123,
          reason: "Can't make it",
          token,
        };

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue({ guest: { email } } as any);
        vi.mocked(ThotisBookingService.prototype.cancelSession).mockResolvedValue({ success: true } as any);

        const result = await caller.guest.cancelByToken(input);

        expect(ThotisGuestService.prototype.verifyToken).toHaveBeenCalledWith(token);
        expect(ThotisBookingService.prototype.cancelSession).toHaveBeenCalledWith(
          input.bookingId,
          input.reason,
          "student",
          expect.objectContaining({ email })
        );
        expect(result).toEqual({ success: true });
      });

      it("should deny access if token is scoped to a different booking", async () => {
        const token = "wrong-scoped-token";
        const email = "guest@example.com";
        const input = {
          bookingId: 123,
          reason: "Can't make it",
          token,
        };

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue({
          guest: { email },
          bookingId: 456, // Different booking
        } as any);

        await expect(caller.guest.cancelByToken(input)).rejects.toThrow("Token not valid for this booking");
      });
    });

    describe("rescheduleByToken", () => {
      it("should allow guest to reschedule session with valid token", async () => {
        const token = "mock-token";
        const email = "guest@example.com";
        const input = {
          bookingId: 123,
          newDateTime: new Date(),
          token,
        };

        const mockResponse = {
          bookingId: 123,
          googleMeetLink: "link",
          calendarEventId: "evt",
          confirmationSent: true,
        };
        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue({ guest: { email } } as any);
        vi.mocked(ThotisBookingService.prototype.rescheduleSession).mockResolvedValue(mockResponse);

        const result = await caller.guest.rescheduleByToken(input);

        expect(ThotisGuestService.prototype.verifyToken).toHaveBeenCalledWith(token);
        expect(ThotisBookingService.prototype.rescheduleSession).toHaveBeenCalledWith(
          input.bookingId,
          input.newDateTime,
          expect.objectContaining({ email })
        );
        expect(result).toEqual(mockResponse);
      });

      it("should deny access if token is scoped to a different booking", async () => {
        const token = "wrong-scoped-token";
        const email = "guest@example.com";
        const input = {
          bookingId: 123,
          newDateTime: new Date(),
          token,
        };

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue({
          guest: { email },
          bookingId: 456, // Different booking
        } as any);

        await expect(caller.guest.rescheduleByToken(input)).rejects.toThrow(
          "Token not valid for this booking"
        );
      });
    });

    describe("getPostSessionDataByToken", () => {
      it("should allow getting post-session data with valid token", async () => {
        const token = "mock-token";
        const bookingId = 123;
        const email = "guest@example.com";
        const mockSummary = { id: 1, content: "Summary" };
        const mockResources = [{ id: 1, title: "Resource" }];

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue({ guest: { email } } as any);

        const prisma = (await import("@calcom/prisma")).default;
        vi.mocked(prisma.booking.findUnique).mockResolvedValue({ responses: { email } } as any);
        // @ts-expect-error
        prisma.thotisSessionSummary = { findUnique: vi.fn().mockResolvedValue(mockSummary) };
        // @ts-expect-error
        prisma.thotisSessionResource = { findMany: vi.fn().mockResolvedValue(mockResources) };

        const result = await caller.guest.getPostSessionDataByToken({ token, bookingId });

        expect(result).toEqual({ summary: mockSummary, resources: mockResources });
      });

      it("should deny access if token is scoped to a different booking", async () => {
        const token = "wrong-scoped-token";
        const bookingId = 123;
        const email = "guest@example.com";

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue({
          guest: { email },
          bookingId: 456, // Different booking
        } as any);

        await expect(caller.guest.getPostSessionDataByToken({ token, bookingId })).rejects.toThrow(
          "Token not valid for this booking"
        );
      });

      it("should deny access if email doesn't match booking", async () => {
        const token = "mock-token";
        const bookingId = 123;
        const email = "guest@example.com";

        vi.mocked(ThotisGuestService.prototype.verifyToken).mockResolvedValue({ guest: { email } } as any);

        const prisma = (await import("@calcom/prisma")).default;
        vi.mocked(prisma.booking.findUnique).mockResolvedValue({
          responses: { email: "other@test.com" },
        } as any);

        await expect(caller.guest.getPostSessionDataByToken({ token, bookingId })).rejects.toThrow(
          "Not authorized"
        );
      });
    });
  });
});
