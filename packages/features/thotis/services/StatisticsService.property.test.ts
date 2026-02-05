import * as fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { RedisService } from "../../redis/RedisService";
import type { ProfileRepository } from "../repositories/ProfileRepository";
import type { SessionRatingRepository } from "../repositories/SessionRatingRepository";
import { StatisticsService } from "./StatisticsService";

// Mock dependencies
const mockProfileRepository = mockDeep<ProfileRepository>();
const mockRatingRepository = mockDeep<SessionRatingRepository>(); // Type-only import working here?
const mockRedisService = mockDeep<RedisService>();

describe("StatisticsService Property Tests", () => {
  let service: StatisticsService;

  beforeEach(() => {
    mockReset(mockProfileRepository);
    mockReset(mockRatingRepository);
    mockReset(mockRedisService);
    service = new StatisticsService(mockProfileRepository, mockRatingRepository, mockRedisService);
  });

  /**
   * Property 18: Statistics Calculation Accuracy
   * Validates: Requirements 7.1
   */
  it("should accurately return student stats from repository", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }), // studentId
        fc.record({
          id: fc.string(),
          totalSessions: fc.integer({ min: 0 }),
          completedSessions: fc.integer({ min: 0 }),
          cancelledSessions: fc.integer({ min: 0 }),
          averageRating: fc.option(fc.float({ min: 1, max: 5, noNaN: true }), { nil: null }),
          totalRatings: fc.integer({ min: 0 }),
        }),
        async (studentId, profileData) => {
          // Reset mocks for each property run
          mockReset(mockProfileRepository);
          mockReset(mockRatingRepository);
          mockReset(mockRedisService);

          // Setup
          mockRedisService.get.mockResolvedValue(null);
          mockProfileRepository.getProfileByUserId.mockResolvedValue({
            ...profileData,
          } as any);

          // Execute
          const stats = await service.getStudentStats(studentId);

          // Verify
          expect(stats).toEqual({
            totalSessions: profileData.totalSessions,
            completedSessions: profileData.completedSessions,
            cancelledSessions: profileData.cancelledSessions,
            averageRating: profileData.averageRating,
            totalRatings: profileData.totalRatings,
          });

          // Verify caching
          expect(mockRedisService.set).toHaveBeenCalledTimes(1);
        }
      )
    );
  });

  /**
   * Property 19: Session Counter Updates
   * Validates: Requirements 7.2, 13.3
   */
  it("should correctly increment session counters based on type", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }), // studentId
        fc.constantFrom("scheduled", "completed", "cancelled") as fc.Arbitrary<
          "scheduled" | "completed" | "cancelled"
        >,
        fc.integer({ min: 0 }), // current count
        async (studentId, type, currentCount) => {
          mockReset(mockProfileRepository);
          mockReset(mockRedisService);

          const profileId = "profile-123";

          // Setup initial state
          mockProfileRepository.getProfileByUserId.mockResolvedValue({
            id: profileId,
            totalSessions: type === "scheduled" ? currentCount : 100,
            completedSessions: type === "completed" ? currentCount : 50,
            cancelledSessions: type === "cancelled" ? currentCount : 10,
          } as any);

          // Execute
          await service.updateSessionCount(studentId, type);

          // Verify update call
          const expectedUpdate: any = {};
          if (type === "scheduled") expectedUpdate.totalSessions = currentCount + 1;
          if (type === "completed") expectedUpdate.completedSessions = currentCount + 1;
          if (type === "cancelled") expectedUpdate.cancelledSessions = currentCount + 1;

          expect(mockProfileRepository.updateStatistics).toHaveBeenCalledWith(profileId, expectedUpdate);

          // Verify cache invalidation
          expect(mockRedisService.del).toHaveBeenCalledWith(`stats:student:${studentId}`);
        }
      )
    );
  });

  /**
   * Property 21: Average Rating Calculation
   * Validates: Requirements 7.4, 19.3
   */
  it("should calculate and update average rating correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }), // studentId
        fc.float({ min: 1, max: 5, noNaN: true }), // calculated average from repo
        async (studentId, rawAvg) => {
          mockReset(mockProfileRepository);
          mockReset(mockRatingRepository);
          mockReset(mockRedisService);

          const profileId = "profile-abc";

          mockProfileRepository.getProfileByUserId.mockResolvedValue({
            id: profileId,
          } as any);

          mockRatingRepository.getAverageRating.mockResolvedValue(rawAvg);

          // Execute
          const result = await service.recalculateAverageRating(studentId);

          // Verify rounding logic (1 decimal)
          const expectedRounded = Math.round(rawAvg * 10) / 10;
          expect(result).toBe(expectedRounded);

          // Verify repository update
          expect(mockProfileRepository.updateStatistics).toHaveBeenCalledWith(profileId, {
            averageRating: expectedRounded,
          });

          // Verify cache invalidation
          expect(mockRedisService.del).toHaveBeenCalledWith(`stats:student:${studentId}`);
        }
      )
    );
  });

  /**
   * Property 42: Low Rating Flagging
   * Validates: Requirements 19.4
   */
  it("should flag low ratings (<= 2) via logging", async () => {
    // Spy on console.warn
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }), // studentId
        fc.integer({ min: 1, max: 5 }), // rating
        async (studentId, rating) => {
          mockReset(mockProfileRepository);
          mockReset(mockRatingRepository);
          mockReset(mockRedisService);
          consoleSpy.mockClear();

          const profileId = "profile-flag";

          mockProfileRepository.getProfileByUserId.mockResolvedValue({
            id: profileId,
          } as any);

          mockRatingRepository.getAverageRating.mockResolvedValue(rating);

          // Execute
          await service.addRating(12345, studentId, rating);

          // Verify flagging
          if (rating <= 2) {
            expect(consoleSpy).toHaveBeenCalledTimes(1);
            expect(consoleSpy.mock.calls[0][0]).toContain("[Low Rating Flag]");
          } else {
            expect(consoleSpy).not.toHaveBeenCalled();
          }
        }
      )
    );

    consoleSpy.mockRestore();
  });

  /**
   * Property 43: Platform Statistics Aggregation
   * Validates: Requirements 20.1
   */
  it("should aggregate platform statistics correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          _sum: fc.record({
            totalSessions: fc.option(fc.integer({ min: 0 }), { nil: null }),
            completedSessions: fc.option(fc.integer({ min: 0 }), { nil: null }),
            cancelledSessions: fc.option(fc.integer({ min: 0 }), { nil: null }),
            totalRatings: fc.option(fc.integer({ min: 0 }), { nil: null }),
          }),
          _avg: fc.record({
            averageRating: fc.option(fc.float({ min: 1, max: 5 }), { nil: null }),
          }),
          _count: fc.record({
            id: fc.integer({ min: 0 }),
          }),
          trends: fc.record({
            daily: fc.array(fc.record({ date: fc.string(), count: fc.integer() })),
            weekly: fc.array(fc.record({ date: fc.string(), count: fc.integer() })),
            monthly: fc.array(fc.record({ date: fc.string(), count: fc.integer() })),
          }),
        }),
        async (mockStats) => {
          mockReset(mockProfileRepository);
          mockReset(mockRatingRepository);
          mockReset(mockRedisService);

          // Setup
          mockProfileRepository.getPlatformAggregates.mockResolvedValue(mockStats as any);
          mockProfileRepository.getBookingTrends.mockResolvedValue(mockStats.trends);

          // Execute
          const result = await service.getPlatformStats();

          // Verify
          expect(result).toEqual(mockStats);
          expect(mockProfileRepository.getPlatformAggregates).toHaveBeenCalledTimes(1);
          expect(mockProfileRepository.getBookingTrends).toHaveBeenCalledTimes(1);
        }
      )
    );
  });
});
