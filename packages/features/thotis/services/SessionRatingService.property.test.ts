import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { SessionRatingRepository } from "../repositories/SessionRatingRepository";
import { SessionRatingService } from "./SessionRatingService";

// Mock Repository
class MockSessionRatingRepository implements SessionRatingRepository {
  private ratings: Map<number, any> = new Map();
  private nextId = 1;

  async createRating(data: any) {
    const id = this.nextId++;
    const rating = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    this.ratings.set(id, rating);
    return rating;
  }

  async findByBookingId(bookingId: number) {
    for (const rating of this.ratings.values()) {
      if (rating.bookingId === bookingId) return rating;
    }
    return null;
  }

  async findByStudentProfileId(studentProfileId: number) {
    const results = [];
    for (const rating of this.ratings.values()) {
      if (rating.studentProfileId === studentProfileId) results.push(rating);
    }
    return results;
  }

  async getAverageRating(studentProfileId: number) {
    let sum = 0;
    let count = 0;
    for (const rating of this.ratings.values()) {
      if (rating.studentProfileId === studentProfileId) {
        sum += rating.rating;
        count++;
      }
    }
    return count > 0 ? sum / count : null;
  }

  async getRatingStats(studentProfileId: number) {
    return { average: null, count: 0, distribution: [] };
  }
  async updateRating(id: number, data: any) {
    return { ...this.ratings.get(id), ...data };
  }
  async deleteRating(id: number) {
    this.ratings.delete(id);
  }
}

describe("SessionRatingService Properties", () => {
  const service = new SessionRatingService(new MockSessionRatingRepository() as any);

  // Property 20: Rating Storage and Validation
  it("should accept valid ratings (1-5) and valid feedback", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }), // bookingId
        fc.integer({ min: 1 }), // studentId
        fc.integer({ min: 1, max: 5 }), // rating
        fc
          .string({ minLength: 10, maxLength: 500 })
          .filter((s) => s.trim().length >= 10), // feedback
        async (bookingId, studentId, rating, feedback) => {
          const result = await service.createRating({
            bookingId,
            studentProfileId: studentId,
            rating,
            feedback,
          });

          expect(result.rating).toBe(rating);
          expect(result.feedback).toBe(feedback);
          expect(result.bookingId).toBe(bookingId);
        }
      )
    );
  });

  it("should reject invalid ratings (<1 or >5)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        fc.integer({ min: 1 }),
        fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 6 })), // invalid rating
        async (bookingId, studentId, rating) => {
          await expect(
            service.createRating({
              bookingId,
              studentProfileId: studentId,
              rating,
              feedback: "Valid feedback text",
            })
          ).rejects.toThrow("Rating must be between 1 and 5");
        }
      )
    );
  });

  it("should reject invalid feedback length", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        fc.integer({ min: 1 }),
        fc.string({ maxLength: 9 }), // too short
        async (bookingId, studentId, feedback) => {
          // Skipping empty string if trimming is involved and empty is allowed?
          // Service code: if (data.feedback !== null) { ... check length }
          // If feedback is empty string, length < 10.
          if (feedback.length > 0) {
            await expect(
              service.createRating({
                bookingId,
                studentProfileId: studentId,
                rating: 5,
                feedback,
              })
            ).rejects.toThrow("Feedback must be between 10 and 500 characters");
          }
        }
      )
    );
    // Property Test for too long
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1 }),
        fc.integer({ min: 1 }),
        fc.string({ minLength: 501, maxLength: 1000 }),
        async (bookingId, studentId, feedback) => {
          await expect(
            service.createRating({
              bookingId,
              studentProfileId: studentId,
              rating: 5,
              feedback,
            })
          ).rejects.toThrow("Feedback must be between 10 and 500 characters");
        }
      )
    );
  });
});
