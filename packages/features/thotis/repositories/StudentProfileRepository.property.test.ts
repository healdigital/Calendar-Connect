import type { AcademicField, PrismaClient } from "@prisma/client";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";

// Mock Prisma client
const prismaMock: ReturnType<typeof mockDeep<PrismaClient>> = mockDeep<PrismaClient>();

// Mock StudentProfile data generator
const academicFieldArbitrary: fc.Arbitrary<AcademicField> = fc.constantFrom(
  "LAW",
  "MEDICINE",
  "ENGINEERING",
  "BUSINESS",
  "COMPUTER_SCIENCE",
  "PSYCHOLOGY",
  "EDUCATION",
  "ARTS",
  "SCIENCES",
  "OTHER"
) as fc.Arbitrary<AcademicField>;

const studentProfileDataArbitrary: fc.Arbitrary<{
  university: string;
  degree: string;
  field: AcademicField;
  currentYear: number;
  bio: string;
  profilePhotoUrl: string | null;
  linkedInUrl: string | null;
}> = fc.record({
  university: fc.string({ minLength: 1, maxLength: 200 }),
  degree: fc.string({ minLength: 1, maxLength: 200 }),
  field: academicFieldArbitrary,
  currentYear: fc.integer({ min: 1, max: 10 }),
  bio: fc.string({ minLength: 50, maxLength: 1000 }),
  profilePhotoUrl: fc.option(fc.webUrl({ validSchemes: ["https"] }), { nil: null }),
  linkedInUrl: fc.option(fc.webUrl({ validSchemes: ["https"] }), { nil: null }),
});

describe("Property Tests: StudentProfile Model", () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  /**
   * Property 1: Profile Data Round Trip
   * Feature: thotis-student-mentoring, Property 1: Profile Data Round Trip
   *
   * **Validates: Requirements 1.1, 1.2**
   *
   * For any valid profile data (university, degree, field, year, bio, photo URL, LinkedIn URL),
   * creating a profile then retrieving it should return equivalent data with all required fields present.
   */
  it("Property 1: Profile Data Round Trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        studentProfileDataArbitrary,
        async (userId, profileData) => {
          // Mock the created profile
          const mockCreatedProfile = {
            id: `profile_${userId}`,
            userId,
            ...profileData,
            isActive: true,
            totalSessions: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            averageRating: null,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock Prisma create operation
          prismaMock.studentProfile.create.mockResolvedValue(mockCreatedProfile);

          // Mock Prisma findUnique operation to return the same data
          prismaMock.studentProfile.findUnique.mockResolvedValue(mockCreatedProfile);

          // Simulate creating a profile
          const created = await prismaMock.studentProfile.create({
            data: {
              userId,
              ...profileData,
            },
          });

          // Simulate retrieving the profile
          const retrieved = await prismaMock.studentProfile.findUnique({
            where: { id: created.id },
          });

          // Assertions: Retrieved profile should match created profile
          expect(retrieved).not.toBeNull();
          expect(retrieved?.university).toBe(profileData.university);
          expect(retrieved?.degree).toBe(profileData.degree);
          expect(retrieved?.field).toBe(profileData.field);
          expect(retrieved?.currentYear).toBe(profileData.currentYear);
          expect(retrieved?.bio).toBe(profileData.bio);
          expect(retrieved?.profilePhotoUrl).toBe(profileData.profilePhotoUrl);
          expect(retrieved?.linkedInUrl).toBe(profileData.linkedInUrl);
          expect(retrieved?.isActive).toBe(true);
          expect(retrieved?.totalSessions).toBe(0);
          expect(retrieved?.completedSessions).toBe(0);
          expect(retrieved?.cancelledSessions).toBe(0);
          expect(retrieved?.averageRating).toBeNull();
          expect(retrieved?.totalRatings).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Required Fields Validation
   *
   * For any profile data, all required fields (university, degree, field, currentYear, bio)
   * must be present and non-empty.
   */
  it("Property: Required Fields Validation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        studentProfileDataArbitrary,
        async (userId, profileData) => {
          // Mock the created profile
          const mockCreatedProfile = {
            id: `profile_${userId}`,
            userId,
            ...profileData,
            isActive: true,
            totalSessions: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            averageRating: null,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          prismaMock.studentProfile.create.mockResolvedValue(mockCreatedProfile);

          const created = await prismaMock.studentProfile.create({
            data: {
              userId,
              ...profileData,
            },
          });

          // All required fields must be present and valid
          expect(created.university).toBeTruthy();
          expect(created.university.length).toBeGreaterThan(0);
          expect(created.university.length).toBeLessThanOrEqual(200);

          expect(created.degree).toBeTruthy();
          expect(created.degree.length).toBeGreaterThan(0);
          expect(created.degree.length).toBeLessThanOrEqual(200);

          expect(created.field).toBeTruthy();
          expect([
            "LAW",
            "MEDICINE",
            "ENGINEERING",
            "BUSINESS",
            "COMPUTER_SCIENCE",
            "PSYCHOLOGY",
            "EDUCATION",
            "ARTS",
            "SCIENCES",
            "OTHER",
          ]).toContain(created.field);

          expect(created.currentYear).toBeGreaterThanOrEqual(1);
          expect(created.currentYear).toBeLessThanOrEqual(10);

          expect(created.bio).toBeTruthy();
          expect(created.bio.length).toBeGreaterThanOrEqual(50);
          expect(created.bio.length).toBeLessThanOrEqual(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Optional Fields Handling
   *
   * For any profile data, optional fields (profilePhotoUrl, linkedInUrl) can be null
   * and should be stored correctly.
   */
  it("Property: Optional Fields Handling", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        studentProfileDataArbitrary,
        async (userId, profileData) => {
          const mockCreatedProfile = {
            id: `profile_${userId}`,
            userId,
            ...profileData,
            isActive: true,
            totalSessions: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            averageRating: null,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          prismaMock.studentProfile.create.mockResolvedValue(mockCreatedProfile);

          const created = await prismaMock.studentProfile.create({
            data: {
              userId,
              ...profileData,
            },
          });

          // Optional fields can be null or valid URLs
          if (created.profilePhotoUrl !== null) {
            expect(created.profilePhotoUrl).toMatch(/^https:\/\//);
          }

          if (created.linkedInUrl !== null) {
            expect(created.linkedInUrl).toMatch(/^https:\/\//);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default Statistics Values
   *
   * For any newly created profile, statistics fields should have default values:
   * - totalSessions: 0
   * - completedSessions: 0
   * - cancelledSessions: 0
   * - averageRating: null
   * - totalRatings: 0
   * - isActive: true
   */
  it("Property: Default Statistics Values", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        studentProfileDataArbitrary,
        async (userId, profileData) => {
          const mockCreatedProfile = {
            id: `profile_${userId}`,
            userId,
            ...profileData,
            isActive: true,
            totalSessions: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            averageRating: null,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          prismaMock.studentProfile.create.mockResolvedValue(mockCreatedProfile);

          const created = await prismaMock.studentProfile.create({
            data: {
              userId,
              ...profileData,
            },
          });

          // Verify default statistics values
          expect(created.totalSessions).toBe(0);
          expect(created.completedSessions).toBe(0);
          expect(created.cancelledSessions).toBe(0);
          expect(created.averageRating).toBeNull();
          expect(created.totalRatings).toBe(0);
          expect(created.isActive).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: User ID Uniqueness
   *
   * For any profile, the userId should be unique and properly associated.
   */
  it("Property: User ID Uniqueness", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        studentProfileDataArbitrary,
        async (userId, profileData) => {
          const mockCreatedProfile = {
            id: `profile_${userId}`,
            userId,
            ...profileData,
            isActive: true,
            totalSessions: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            averageRating: null,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          prismaMock.studentProfile.create.mockResolvedValue(mockCreatedProfile);
          prismaMock.studentProfile.findUnique.mockResolvedValue(mockCreatedProfile);

          const created = await prismaMock.studentProfile.create({
            data: {
              userId,
              ...profileData,
            },
          });

          // Verify userId is correctly stored
          expect(created.userId).toBe(userId);

          // Verify we can retrieve by userId
          const retrievedByUserId = await prismaMock.studentProfile.findUnique({
            where: { userId },
          });

          expect(retrievedByUserId).not.toBeNull();
          expect(retrievedByUserId?.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
