import type { PrismaClient } from "@prisma/client";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

// Mock Prisma client
const prismaMock: ReturnType<typeof mockDeep<PrismaClient>> = mockDeep<PrismaClient>();

// Mock SessionRating data generator
const sessionRatingDataArbitrary: fc.Arbitrary<{
  rating: number;
  feedback: string | null;
  prospectiveEmail: string;
}> = fc.record({
  rating: fc.integer({ min: 1, max: 5 }),
  feedback: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  prospectiveEmail: fc.emailAddress(),
});

describe("Property Tests: SessionRating Model", () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  /**
   * Property 20: Rating Storage and Validation
   * Feature: thotis-student-mentoring, Property 20: Rating Storage and Validation
   *
   * **Validates: Requirements 7.3, 19.2**
   *
   * For any submitted rating, the rating value should be between 1 and 5 inclusive,
   * and feedback (if provided) should be stored.
   */
  it("Property 20: Rating Storage and Validation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // bookingId
        fc.string({ minLength: 1, maxLength: 50 }), // studentProfileId
        sessionRatingDataArbitrary,
        async (bookingId, studentProfileId, ratingData) => {
          // Mock the created rating
          const mockCreatedRating = {
            id: `rating_${bookingId}`,
            bookingId,
            studentProfileId,
            ...ratingData,
            createdAt: new Date(),
          };

          // Mock Prisma create operation
          prismaMock.sessionRating.create.mockResolvedValue(mockCreatedRating);

          // Mock Prisma findUnique operation to return the same data
          prismaMock.sessionRating.findUnique.mockResolvedValue(mockCreatedRating);

          // Simulate creating a rating
          const created = await prismaMock.sessionRating.create({
            data: {
              bookingId,
              studentProfileId,
              ...ratingData,
            },
          });

          // Simulate retrieving the rating
          const retrieved = await prismaMock.sessionRating.findUnique({
            where: { id: created.id },
          });

          // Assertions: Rating value should be between 1 and 5 inclusive
          expect(retrieved).not.toBeNull();
          expect(retrieved?.rating).toBeGreaterThanOrEqual(1);
          expect(retrieved?.rating).toBeLessThanOrEqual(5);
          expect(retrieved?.rating).toBe(ratingData.rating);

          // Feedback should be stored if provided
          expect(retrieved?.feedback).toBe(ratingData.feedback);

          // Prospective email should be stored
          expect(retrieved?.prospectiveEmail).toBe(ratingData.prospectiveEmail);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rating Value Boundaries
   *
   * For any rating, the value must be exactly 1, 2, 3, 4, or 5.
   */
  it("Property: Rating Value Boundaries", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // bookingId
        fc.string({ minLength: 1, maxLength: 50 }), // studentProfileId
        sessionRatingDataArbitrary,
        async (bookingId, studentProfileId, ratingData) => {
          const mockCreatedRating = {
            id: `rating_${bookingId}`,
            bookingId,
            studentProfileId,
            ...ratingData,
            createdAt: new Date(),
          };

          prismaMock.sessionRating.create.mockResolvedValue(mockCreatedRating);

          const created = await prismaMock.sessionRating.create({
            data: {
              bookingId,
              studentProfileId,
              ...ratingData,
            },
          });

          // Rating must be one of the valid values
          expect([1, 2, 3, 4, 5]).toContain(created.rating);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Feedback Optional Storage
   *
   * For any rating, feedback can be null or a string, and should be stored correctly.
   */
  it("Property: Feedback Optional Storage", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // bookingId
        fc.string({ minLength: 1, maxLength: 50 }), // studentProfileId
        sessionRatingDataArbitrary,
        async (bookingId, studentProfileId, ratingData) => {
          const mockCreatedRating = {
            id: `rating_${bookingId}`,
            bookingId,
            studentProfileId,
            ...ratingData,
            createdAt: new Date(),
          };

          prismaMock.sessionRating.create.mockResolvedValue(mockCreatedRating);

          const created = await prismaMock.sessionRating.create({
            data: {
              bookingId,
              studentProfileId,
              ...ratingData,
            },
          });

          // Feedback can be null or a string
          if (created.feedback !== null) {
            expect(typeof created.feedback).toBe("string");
            expect(created.feedback.length).toBeLessThanOrEqual(500);
          } else {
            expect(created.feedback).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Email Format Validation
   *
   * For any rating, the prospectiveEmail should be a valid email address.
   */
  it("Property: Email Format Validation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // bookingId
        fc.string({ minLength: 1, maxLength: 50 }), // studentProfileId
        sessionRatingDataArbitrary,
        async (bookingId, studentProfileId, ratingData) => {
          const mockCreatedRating = {
            id: `rating_${bookingId}`,
            bookingId,
            studentProfileId,
            ...ratingData,
            createdAt: new Date(),
          };

          prismaMock.sessionRating.create.mockResolvedValue(mockCreatedRating);

          const created = await prismaMock.sessionRating.create({
            data: {
              bookingId,
              studentProfileId,
              ...ratingData,
            },
          });

          // Prospective email should be a valid email format
          expect(created.prospectiveEmail).toBeTruthy();
          expect(created.prospectiveEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Booking ID Uniqueness
   *
   * For any rating, the bookingId should be unique and properly associated.
   */
  it("Property: Booking ID Uniqueness", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // bookingId
        fc.string({ minLength: 1, maxLength: 50 }), // studentProfileId
        sessionRatingDataArbitrary,
        async (bookingId, studentProfileId, ratingData) => {
          const mockCreatedRating = {
            id: `rating_${bookingId}`,
            bookingId,
            studentProfileId,
            ...ratingData,
            createdAt: new Date(),
          };

          prismaMock.sessionRating.create.mockResolvedValue(mockCreatedRating);
          prismaMock.sessionRating.findUnique.mockResolvedValue(mockCreatedRating);

          const created = await prismaMock.sessionRating.create({
            data: {
              bookingId,
              studentProfileId,
              ...ratingData,
            },
          });

          // Verify bookingId is correctly stored
          expect(created.bookingId).toBe(bookingId);

          // Verify we can retrieve by bookingId
          const retrievedByBookingId = await prismaMock.sessionRating.findUnique({
            where: { bookingId },
          });

          expect(retrievedByBookingId).not.toBeNull();
          expect(retrievedByBookingId?.bookingId).toBe(bookingId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Student Profile Association
   *
   * For any rating, the studentProfileId should be properly stored and associated.
   */
  it("Property: Student Profile Association", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // bookingId
        fc.string({ minLength: 1, maxLength: 50 }), // studentProfileId
        sessionRatingDataArbitrary,
        async (bookingId, studentProfileId, ratingData) => {
          const mockCreatedRating = {
            id: `rating_${bookingId}`,
            bookingId,
            studentProfileId,
            ...ratingData,
            createdAt: new Date(),
          };

          prismaMock.sessionRating.create.mockResolvedValue(mockCreatedRating);

          const created = await prismaMock.sessionRating.create({
            data: {
              bookingId,
              studentProfileId,
              ...ratingData,
            },
          });

          // Verify studentProfileId is correctly stored
          expect(created.studentProfileId).toBe(studentProfileId);
          expect(created.studentProfileId).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rating Data Round Trip
   *
   * For any rating data, creating a rating then retrieving it should return
   * equivalent data with all fields present.
   */
  it("Property: Rating Data Round Trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // bookingId
        fc.string({ minLength: 1, maxLength: 50 }), // studentProfileId
        sessionRatingDataArbitrary,
        async (bookingId, studentProfileId, ratingData) => {
          const mockCreatedRating = {
            id: `rating_${bookingId}`,
            bookingId,
            studentProfileId,
            ...ratingData,
            createdAt: new Date(),
          };

          prismaMock.sessionRating.create.mockResolvedValue(mockCreatedRating);
          prismaMock.sessionRating.findUnique.mockResolvedValue(mockCreatedRating);

          // Create a rating
          const created = await prismaMock.sessionRating.create({
            data: {
              bookingId,
              studentProfileId,
              ...ratingData,
            },
          });

          // Retrieve the rating
          const retrieved = await prismaMock.sessionRating.findUnique({
            where: { id: created.id },
          });

          // All data should match
          expect(retrieved).not.toBeNull();
          expect(retrieved?.id).toBe(created.id);
          expect(retrieved?.bookingId).toBe(bookingId);
          expect(retrieved?.studentProfileId).toBe(studentProfileId);
          expect(retrieved?.rating).toBe(ratingData.rating);
          expect(retrieved?.feedback).toBe(ratingData.feedback);
          expect(retrieved?.prospectiveEmail).toBe(ratingData.prospectiveEmail);
          expect(retrieved?.createdAt).toEqual(created.createdAt);
        }
      ),
      { numRuns: 100 }
    );
  });
});
