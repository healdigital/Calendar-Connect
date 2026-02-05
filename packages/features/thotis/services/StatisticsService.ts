import process from "node:process";
import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import { RedisService } from "../../redis/RedisService";
import type { ProfileRepository } from "../repositories/ProfileRepository";
import type { SessionRatingRepository } from "../repositories/SessionRatingRepository";

export interface StudentStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageRating: number | null;
  totalRatings: number;
}

export interface PlatformStats {
  _sum: {
    totalSessions: number | null;
    completedSessions: number | null;
    cancelledSessions: number | null;
    totalRatings: number | null;
  };
  _avg: {
    averageRating: number | null;
  };
  _count: {
    id: number;
  };
  trends: {
    daily: { date: string; count: number }[];
    weekly: { date: string; count: number }[];
    monthly: { date: string; count: number }[];
  };
  fieldDistribution: { field: string; _count: { id: number } }[];
}

export class StatisticsService {
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly ratingRepository: SessionRatingRepository,
    private redis?: RedisService
  ) {
    // Try to initialize Redis if not provided and env vars exist
    if (!this.redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.redis = new RedisService();
      } catch (e) {
        console.warn("Failed to initialize RedisService in StatisticsService", e);
      }
    }
  }

  /**
   * Get statistics for a specific student with caching
   * Requirement 19.3: View stats
   */
  async getStudentStats(studentId: number): Promise<StudentStats | null> {
    const cacheKey = `stats:student:${studentId}`;

    if (this.redis) {
      const cached = await this.redis.get<StudentStats>(cacheKey);
      if (cached) return cached;
    }

    const profile = await this.profileRepository.getProfileByUserId(studentId);
    if (!profile) return null;

    const stats: StudentStats = {
      totalSessions: profile.totalSessions,
      completedSessions: profile.completedSessions,
      cancelledSessions: profile.cancelledSessions,
      averageRating: profile.averageRating ? Number(profile.averageRating) : null,
      totalRatings: profile.totalRatings,
    };

    if (this.redis) {
      await this.redis.set(cacheKey, stats, { ttl: this.CACHE_TTL });
    }

    return stats;
  }

  /**
   * Update session counters for a student
   * Requirements 7.2, 13.3: Metrics updates
   */
  async updateSessionCount(studentId: number, type: "scheduled" | "completed" | "cancelled"): Promise<void> {
    const profile = await this.profileRepository.getProfileByUserId(studentId);
    if (!profile) {
      throw new ErrorWithCode(ErrorCode.NotFound, "Student profile not found");
    }

    const updates: Partial<StudentStats> = {};

    // Increment the appropriate counter
    // For 'scheduled', we only increment totalSessions
    // For 'completed', we increment completedSessions (and NOT totalSessions, assuming it was already counted when scheduled)
    // For 'cancelled', we increment cancelledSessions

    switch (type) {
      case "scheduled":
        updates.totalSessions = profile.totalSessions + 1;
        break;
      case "completed":
        updates.completedSessions = profile.completedSessions + 1;
        break;
      case "cancelled":
        updates.cancelledSessions = profile.cancelledSessions + 1;
        break;
    }

    await this.profileRepository.updateStatistics(profile.id, updates);

    // Invalidate cache
    if (this.redis) {
      await this.redis.del(`stats:student:${studentId}`);
      await this.redis.del(`profile:${studentId}`);
    }
  }

  /**
   * Add a new rating and update average
   * Requirements 7.3, 7.4: Ratings and Average
   */
  async addRating(
    bookingId: number,
    studentId: number,
    rating: number,
    feedback?: string | null,
    prospectiveEmail?: string
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Rating must be between 1 and 5");
    }

    const profile = await this.profileRepository.getProfileByUserId(studentId);
    if (!profile) {
      throw new ErrorWithCode(ErrorCode.NotFound, "Student profile not found");
    }

    // Flag low ratings
    if (rating <= 2) {
      console.warn(
        `[Low Rating Flag] Student ${studentId} received a low rating of ${rating} for booking ${bookingId}`
      );
    }

    // Pass the profile ID (which is likely string) to the repository.
    // We cast to any to bypass potential type mismatch if repository definition is using number
    // but Prisma uses string CUIDs.
    await this.ratingRepository.createRating({
      bookingId,
      studentProfileId: profile.id,
      rating,
      feedback: feedback || null,
      prospectiveEmail,
    });

    await this.recalculateAverageRating(studentId);
  }

  /**
   * Recalculate and update average rating
   * Requirements 7.4, 7.5, 19.3: Average calc and storage
   */
  async recalculateAverageRating(studentId: number): Promise<number> {
    const profile = await this.profileRepository.getProfileByUserId(studentId);
    if (!profile) {
      throw new ErrorWithCode(ErrorCode.NotFound, "Student profile not found");
    }

    const avg = await this.ratingRepository.getAverageRating(profile.id);

    // Round to 1 decimal
    const roundedAvg = avg ? Math.round(avg * 10) / 10 : null;

    // Update profile
    await this.profileRepository.updateStatistics(profile.id, {
      averageRating: roundedAvg,
    });

    // Invalidate cache
    if (this.redis) {
      await this.redis.del(`stats:student:${studentId}`);
      await this.redis.del(`profile:${studentId}`);
    }

    return roundedAvg || 0;
  }

  /**
   * Get platform aggregator stats
   * Requirement 20.3: Platform analytics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const aggregates = await this.profileRepository.getPlatformAggregates();
    const trends = await this.profileRepository.getBookingTrends();
    const fieldDistribution = await this.profileRepository.getFieldDistribution();

    return {
      _sum: {
        totalSessions: aggregates._sum.totalSessions,
        completedSessions: aggregates._sum.completedSessions,
        cancelledSessions: aggregates._sum.cancelledSessions,
        totalRatings: aggregates._sum.totalRatings,
      },
      _avg: {
        averageRating: aggregates._avg.averageRating ? Number(aggregates._avg.averageRating) : null,
      },
      _count: aggregates._count,
      trends,
      fieldDistribution: fieldDistribution as { field: string; _count: { id: number } }[],
    };
  }
}
