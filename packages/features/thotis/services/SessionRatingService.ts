import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import type { SessionRatingRepository } from "../repositories/SessionRatingRepository";
import { AnalyticsService } from "./AnalyticsService";

/**
 * Service for managing session ratings
 * Implements business logic and validation for rating operations
 */
export class SessionRatingService {
  private analytics: AnalyticsService;

  constructor(
    private readonly repository: SessionRatingRepository,
    analytics?: AnalyticsService
  ) {
    this.analytics = analytics || new AnalyticsService();
  }

  /**
   * Creates a new session rating with validation
   * Validates: Rating (1-5), Feedback length (10-500 chars if provided)
   */
  async createRating(data: {
    bookingId: number;
    studentProfileId: string;
    rating: number;
    feedback?: string | null;
  }): Promise<{
    id: string; // Prisma uses cuid for SessionRating id
    bookingId: number;
    studentProfileId: string;
    rating: number;
    feedback: string | null;
    createdAt: Date;
    // updatedAt: Date; // Removed as SessionRating model doesn't have updatedAt
  }> {
    // Validate rating (Property 21)
    if (data.rating < 1 || data.rating > 5) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Rating must be between 1 and 5");
    }

    // Validate feedback if provided (Property 22)
    if (data.feedback !== null && data.feedback !== undefined) {
      const feedbackLength = data.feedback.trim().length;
      if (feedbackLength < 10 || feedbackLength > 500) {
        throw new ErrorWithCode(ErrorCode.BadRequest, "Feedback must be between 10 and 500 characters");
      }
    }

    const rating = await this.repository.createRating({
      bookingId: data.bookingId,
      studentProfileId: data.studentProfileId,
      rating: data.rating,
      feedback: data.feedback ?? null,
    });

    this.analytics.trackRatingSubmitted(rating as any, { metadata: (rating as any).booking?.metadata });

    // Casting as necessary if types diverge deeply, or aligning interface
    return {
      ...rating,
      id: rating.id,
    } as any;
  }

  /**
   * Retrieves a rating by booking ID
   */
  async getRatingByBookingId(bookingId: number): Promise<{
    id: string;
    bookingId: number;
    studentProfileId: string;
    rating: number;
    feedback: string | null;
    createdAt: Date;
  } | null> {
    const rating = await this.repository.findByBookingId(bookingId);
    return rating ? (rating as any) : null;
  }

  /**
   * Retrieves all ratings for a student profile
   */
  async getRatingsByStudentProfileId(studentProfileId: string): Promise<
    Array<{
      id: string;
      bookingId: number;
      studentProfileId: string;
      rating: number;
      feedback: string | null;
      createdAt: Date;
    }>
  > {
    const ratings = await this.repository.findByStudentProfileId(studentProfileId);
    return ratings as any[];
  }

  /**
   * Calculates the average rating for a student profile (Property 23)
   * Returns null if no ratings exist
   */
  async getAverageRating(studentProfileId: string): Promise<number | null> {
    return this.repository.getAverageRating(studentProfileId);
  }

  /**
   * Gets comprehensive rating statistics for a student profile
   */
  async getRatingStats(studentProfileId: string): Promise<{
    average: number | null;
    count: number;
    distribution: { rating: number; count: number }[];
  }> {
    return this.repository.getRatingStats(studentProfileId);
  }

  /**
   * Updates an existing rating with validation
   */
  async updateRating(
    id: string,
    data: {
      rating?: number;
      feedback?: string | null;
    }
  ): Promise<{
    id: string;
    bookingId: number;
    studentProfileId: string;
    rating: number;
    feedback: string | null;
    createdAt: Date;
  }> {
    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Rating must be between 1 and 5");
    }

    // Validate feedback if provided
    if (data.feedback !== null && data.feedback !== undefined) {
      const feedbackLength = data.feedback.trim().length;
      if (feedbackLength < 10 || feedbackLength > 500) {
        throw new ErrorWithCode(ErrorCode.BadRequest, "Feedback must be between 10 and 500 characters");
      }
    }

    const result = await this.repository.updateRating(id, data);
    return result as any;
  }

  /**
   * Deletes a rating
   */
  async deleteRating(id: string): Promise<void> {
    await this.repository.deleteRating(id);
  }
}
