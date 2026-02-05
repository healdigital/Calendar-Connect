import type { AcademicField } from "@calcom/prisma/enums";
import type { PrismaClient } from "@prisma/client";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { ProfileRepository } from "./ProfileRepository";

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

describe("Property Tests: ProfileRepository", () => {
  let repository: ProfileRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new ProfileRepository({ prismaClient: prismaMock });
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  /**
   * Property 2: Profile Photo Normalization
   * Feature: thotis-student-mentoring, Property 2: Profile Photo Normalization
   *
   * **Validates: Requirements 1.3**
   *
   * For any uploaded image URL, the repository should correctly store and retrieve
   * the profile photo URL. This test validates the data persistence layer for profile photos.
   * Note: Actual image resizing to 400x400 pixels is handled by ProfileService (task 3.1).
   */
  it("Property 2: Profile Photo Normalization - URL Storage", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        fc.webUrl({ validSchemes: ["https"] }), // profilePhotoUrl
        studentProfileDataArbitrary,
        async (userId, profilePhotoUrl, profileData) => {
          // Create profile data with the specific photo URL
          const dataWithPhoto = {
            ...profileData,
            profilePhotoUrl,
          };

          // Mock the created profile
          const mockCreatedProfile = {
            id: `profile_${userId}`,
            userId,
            ...dataWithPhoto,
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

          // Create a profile with photo URL
          const created = await repository.createProfile(userId, dataWithPhoto);

          // Retrieve the profile
          const retrieved = await repository.getProfile(created.id);

          // Assertions: Profile photo URL should be stored and retrieved correctly
          expect(retrieved).not.toBeNull();
          expect(retrieved?.profilePhotoUrl).toBe(profilePhotoUrl);
          expect(retrieved?.profilePhotoUrl).toMatch(/^https:\/\//);

          // Verify the URL is a valid HTTPS URL
          if (retrieved?.profilePhotoUrl) {
            expect(() => new URL(retrieved.profilePhotoUrl)).not.toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Profile Photo URL Null Handling
   *
   * For any profile without a photo URL (null), the repository should correctly
   * store and retrieve null values.
   */
  it("Property: Profile Photo URL Null Handling", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        studentProfileDataArbitrary,
        async (userId, profileData) => {
          // Create profile data with null photo URL
          const dataWithoutPhoto = {
            ...profileData,
            profilePhotoUrl: null,
          };

          // Mock the created profile
          const mockCreatedProfile = {
            id: `profile_${userId}`,
            userId,
            ...dataWithoutPhoto,
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

          // Create a profile without photo URL
          const created = await repository.createProfile(userId, dataWithoutPhoto);

          // Retrieve the profile
          const retrieved = await repository.getProfile(created.id);

          // Assertions: Profile photo URL should be null
          expect(retrieved).not.toBeNull();
          expect(retrieved?.profilePhotoUrl).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Profile Photo URL Update
   *
   * For any profile, updating the photo URL should correctly persist the new value.
   */
  it("Property: Profile Photo URL Update", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // profileId
        fc.webUrl({ validSchemes: ["https"] }), // oldPhotoUrl
        fc.webUrl({ validSchemes: ["https"] }), // newPhotoUrl
        async (profileId, oldPhotoUrl, newPhotoUrl) => {
          // Mock existing profile with old photo URL
          const mockExistingProfile = {
            id: profileId,
            userId: 1,
            university: "Test University",
            degree: "Test Degree",
            field: "LAW" as AcademicField,
            currentYear: 2,
            bio: "Test bio that is long enough to meet the minimum character requirement for profiles.",
            profilePhotoUrl: oldPhotoUrl,
            linkedInUrl: null,
            isActive: true,
            totalSessions: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            averageRating: null,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock updated profile with new photo URL
          const mockUpdatedProfile = {
            ...mockExistingProfile,
            profilePhotoUrl: newPhotoUrl,
          };

          prismaMock.studentProfile.findUnique.mockResolvedValue(mockExistingProfile);
          prismaMock.studentProfile.update.mockResolvedValue(mockUpdatedProfile);

          // Update the profile photo URL
          const updated = await repository.updateProfile(profileId, {
            profilePhotoUrl: newPhotoUrl,
          });

          // Assertions: Photo URL should be updated
          expect(updated).not.toBeNull();
          expect(updated?.profilePhotoUrl).toBe(newPhotoUrl);
          expect(updated?.profilePhotoUrl).not.toBe(oldPhotoUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Profile Photo URL HTTPS Validation
   *
   * For any profile with a photo URL, the URL should use HTTPS protocol for security.
   */
  it("Property: Profile Photo URL HTTPS Validation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }), // userId
        studentProfileDataArbitrary,
        async (userId, profileData) => {
          // Only test when profilePhotoUrl is not null
          if (profileData.profilePhotoUrl === null) {
            return; // Skip this iteration
          }

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

          const created = await repository.createProfile(userId, profileData);

          // Assertions: Photo URL should use HTTPS
          if (created.profilePhotoUrl !== null) {
            expect(created.profilePhotoUrl).toMatch(/^https:\/\//);
            const url = new URL(created.profilePhotoUrl);
            expect(url.protocol).toBe("https:");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Profile Photo URL Persistence Across Updates
   *
   * For any profile, if the photo URL is not included in an update,
   * it should remain unchanged.
   */
  it("Property: Profile Photo URL Persistence Across Updates", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // profileId
        fc.webUrl({ validSchemes: ["https"] }), // photoUrl
        fc.string({ minLength: 50, maxLength: 1000 }), // newBio
        async (profileId, photoUrl, newBio) => {
          // Mock existing profile with photo URL
          const mockExistingProfile = {
            id: profileId,
            userId: 1,
            university: "Test University",
            degree: "Test Degree",
            field: "LAW" as AcademicField,
            currentYear: 2,
            bio: "Original bio that is long enough to meet the minimum character requirement for profiles.",
            profilePhotoUrl: photoUrl,
            linkedInUrl: null,
            isActive: true,
            totalSessions: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            averageRating: null,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock updated profile with new bio but same photo URL
          const mockUpdatedProfile = {
            ...mockExistingProfile,
            bio: newBio,
          };

          prismaMock.studentProfile.findUnique.mockResolvedValue(mockExistingProfile);
          prismaMock.studentProfile.update.mockResolvedValue(mockUpdatedProfile);

          // Update only the bio, not the photo URL
          const updated = await repository.updateProfile(profileId, {
            bio: newBio,
          });

          // Assertions: Photo URL should remain unchanged
          expect(updated).not.toBeNull();
          expect(updated?.profilePhotoUrl).toBe(photoUrl);
          expect(updated?.bio).toBe(newBio);
        }
      ),
      { numRuns: 100 }
    );
  });
});
