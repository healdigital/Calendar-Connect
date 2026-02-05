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
    studentProfileId: number;
    rating: number;
    feedback?: string | null;
  }): Promise<{
    id: number;
    bookingId: number;
    studentProfileId: number;
    rating: number;
    feedback: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Validate rating (Property 21)
    if (data.rating < 1 || data.rating > 5) {
      throw new ErrorWithCode("INVALID_RATING", "Rating must be between 1 and 5");
    }

    // Validate feedback if provided (Property 22)
    if (data.feedback !== null && data.feedback !== undefined) {
      const feedbackLength = data.feedback.trim().length;
      if (feedbackLength < 10 || feedbackLength > 500) {
        throw new ErrorWithCode("INVALID_FEEDBACK", "Feedback must be between 10 and 500 characters");
      }
    }

    const rating = await this.repository.createRating({
      bookingId: data.bookingId,
      studentProfileId: data.studentProfileId,
      rating: data.rating,
      feedback: data.feedback ?? null,
    });

    this.analytics.trackRatingSubmitted(
      {
        rating: rating.rating,
        feedback: rating.feedback,
        bookingId: rating.bookingId,
        studentProfileId: rating.studentProfileId,
      },
      rating.bookingId,
      rating.studentProfileId // Assuming this is studentProfileId, need to check tracking method signature
    );

    return rating;
  }

  /**
   * Retrieves a rating by booking ID
   */
  async getRatingByBookingId(bookingId: number): Promise<{
    id: number;
    bookingId: number;
    studentProfileId: number;
    rating: number;
    feedback: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return this.repository.findByBookingId(bookingId);
  }

  /**
   * Retrieves all ratings for a student profile
   */
  async getRatingsByStudentProfileId(studentProfileId: number): Promise<
    Array<{
      id: number;
      bookingId: number;
      studentProfileId: number;
      rating: number;
      feedback: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    return this.repository.findByStudentProfileId(studentProfileId);
  }

  /**
   * Calculates the average rating for a student profile (Property 23)
   * Returns null if no ratings exist
   */
  async getAverageRating(studentProfileId: number): Promise<number | null> {
    return this.repository.getAverageRating(studentProfileId);
  }

  /**
   * Gets comprehensive rating statistics for a student profile
   */
  async getRatingStats(studentProfileId: number): Promise<{
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
    id: number,
    data: {
      rating?: number;
      feedback?: string | null;
    }
  ): Promise<{
    id: number;
    bookingId: number;
    studentProfileId: number;
    rating: number;
    feedback: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new ErrorWithCode("INVALID_RATING", "Rating must be between 1 and 5");
    }

    // Validate feedback if provided
    if (data.feedback !== null && data.feedback !== undefined) {
      const feedbackLength = data.feedback.trim().length;
      if (feedbackLength < 10 || feedbackLength > 500) {
        throw new ErrorWithCode("INVALID_FEEDBACK", "Feedback must be between 10 and 500 characters");
      }
    }

    return this.repository.updateRating(id, data);
  }

  /**
   * Deletes a rating
   */
  async deleteRating(id: number): Promise<void> {
    return this.repository.deleteRating(id);
  }
}
