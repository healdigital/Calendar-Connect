import type { PrismaClient } from "@calcom/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { thotisRouter } from "./thotis";

// Mock dependencies
vi.mock("@calcom/features/thotis/services/ProfileService");
vi.mock("@calcom/features/thotis/services/ThotisBookingService");
vi.mock("@calcom/features/thotis/services/StatisticsService");
vi.mock("@calcom/features/thotis/repositories/ProfileRepository");
vi.mock("@calcom/features/thotis/repositories/SessionRatingRepository");
vi.mock("@calcom/prisma", () => ({ default: {} }));

// Mock session middleware to bypass auth
vi.mock("../middlewares/sessionMiddleware", () => {
  const mockMiddleware = ({ ctx, next }: any) => {
    return next({
      ctx: {
        user: ctx.user,
        session: ctx.session,
      },
    });
  };
  return {
    isAuthed: mockMiddleware,
    isAdminMiddleware: mockMiddleware,
    isOrgAdminMiddleware: mockMiddleware,
  };
});

// Import mocked classes to set up return values
import { ProfileService } from "@calcom/features/thotis/services/ProfileService";
import { StatisticsService } from "@calcom/features/thotis/services/StatisticsService";
import { ThotisBookingService } from "@calcom/features/thotis/services/ThotisBookingService";

describe("thotisRouter", () => {
  let mockCtx: any;
  let caller: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user context
    mockCtx = {
      user: {
        id: 1,
        email: "test@example.com",
      },
      session: {
        user: { id: 1 },
      },
      prisma: {} as PrismaClient,
    };

    // Create caller
    // @ts-expect-error - casting context
    caller = thotisRouter.createCaller(mockCtx);
  });

  describe("profileRouter", () => {
    it("should create profile", async () => {
      const input = {
        fieldOfStudy: "COMPUTER_SCIENCE",
        yearOfStudy: 3,
        bio: "Test bio",
        university: "Test University",
        degree: "Bachelor",
      };

      const mockProfile = { ...input, userId: 1, id: "profile-1" };
      // @ts-expect-error
      vi.mocked(ProfileService).prototype.createProfile.mockResolvedValue(mockProfile);

      const result = await caller.profile.create(input);

      expect(ProfileService.prototype.createProfile).toHaveBeenCalledWith({
        userId: 1,
        ...input,
      });
      expect(result).toEqual(mockProfile);
    });

    it("should update profile", async () => {
      const input = { bio: "Updated bio" };
      const mockProfile = { userId: 1, bio: "Updated bio" };
      // @ts-expect-error
      vi.mocked(ProfileService).prototype.updateProfile.mockResolvedValue(mockProfile);

      const result = await caller.profile.update(input);

      expect(ProfileService.prototype.updateProfile).toHaveBeenCalledWith(1, input);
      expect(result).toEqual(mockProfile);
    });

    it("should get profile", async () => {
      const mockProfile = { userId: 1, bio: "My bio" };
      // @ts-expect-error
      vi.mocked(ProfileService).prototype.getProfile.mockResolvedValue(mockProfile);

      const result = await caller.profile.get();

      expect(ProfileService.prototype.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfile);
    });
  });

  describe("bookingRouter", () => {
    it("should create session", async () => {
      const input = {
        studentProfileId: "profile-1",
        dateTime: new Date("2023-01-01T10:00:00Z"),
        prospectiveStudent: {
          name: "Test Student",
          email: "student@test.com",
          question: "Help me",
        },
      };

      const mockResponse = {
        bookingId: 100,
        googleMeetLink: "https://meet.google.com/abc-defg-hij",
        calendarEventId: "evt-123",
        confirmationSent: false,
      };

      // @ts-expect-error
      vi.mocked(ThotisBookingService).prototype.createStudentSession.mockResolvedValue(mockResponse);

      const result = await caller.booking.createSession(input);

      expect(ThotisBookingService.prototype.createStudentSession).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it("should get availability", async () => {
      const input = {
        studentProfileId: "profile-1",
        start: new Date("2023-01-01"),
        end: new Date("2023-01-02"),
      };

      const mockSlots = [{ start: new Date(), end: new Date(), available: true }];
      // @ts-expect-error
      vi.mocked(ThotisBookingService).prototype.getStudentAvailability.mockResolvedValue(mockSlots);

      const result = await caller.booking.getAvailability(input);

      expect(ThotisBookingService.prototype.getStudentAvailability).toHaveBeenCalledWith(
        input.studentProfileId,
        { start: input.start, end: input.end }
      );
      expect(result).toEqual(mockSlots);
    });
  });

  describe("statisticsRouter", () => {
    it("should get student stats", async () => {
      const mockStats = {
        totalSessions: 10,
        completedSessions: 8,
        cancelledSessions: 2,
        averageRating: 4.5,
        totalRatings: 5,
      };

      // @ts-expect-error
      vi.mocked(StatisticsService).prototype.getStudentStats.mockResolvedValue(mockStats);

      const result = await caller.statistics.studentStats({ studentId: 123 });

      expect(StatisticsService.prototype.getStudentStats).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockStats);
    });
  });
});
