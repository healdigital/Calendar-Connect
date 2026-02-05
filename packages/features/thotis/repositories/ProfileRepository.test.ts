import type { AcademicField, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { ProfileRepository } from "./ProfileRepository";

// Mock Prisma client
const prismaMock = mockDeep<PrismaClient>();

describe("ProfileRepository", () => {
  let repository: ProfileRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new ProfileRepository({ prismaClient: prismaMock });
  });

  describe("createProfile", () => {
    it("should create a profile with all required fields", async () => {
      const userId = 1;
      const profileData = {
        university: "Université Paris 1 Panthéon-Sorbonne",
        degree: "Master en Droit des Affaires",
        field: "LAW" as AcademicField,
        currentYear: 2,
        bio: "Passionnée par le droit des affaires et le droit européen. J'ai effectué un stage chez un cabinet d'avocats.",
        profilePhotoUrl: "https://example.com/photo.jpg",
        linkedInUrl: "https://linkedin.com/in/example",
      };

      const mockProfile = {
        id: "profile_1",
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

      prismaMock.studentProfile.create.mockResolvedValue(mockProfile);

      const result = await repository.createProfile(userId, profileData);

      expect(result).toEqual(mockProfile);
      expect(prismaMock.studentProfile.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...profileData,
        },
        select: expect.any(Object),
      });
    });

    it("should handle null profile photo URL", async () => {
      const userId = 2;
      const profileData = {
        university: "Test University",
        degree: "Test Degree",
        field: "ENGINEERING" as AcademicField,
        currentYear: 1,
        bio: "This is a test bio that is long enough to meet the minimum character requirement for profiles.",
        profilePhotoUrl: null,
        linkedInUrl: null,
      };

      const mockProfile = {
        id: "profile_2",
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

      prismaMock.studentProfile.create.mockResolvedValue(mockProfile);

      const result = await repository.createProfile(userId, profileData);

      expect(result.profilePhotoUrl).toBeNull();
      expect(result.linkedInUrl).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("should return null if profile does not exist", async () => {
      const profileId = "nonexistent";
      prismaMock.studentProfile.findUnique.mockResolvedValue(null);

      const result = await repository.updateProfile(profileId, { bio: "Updated bio" });

      expect(result).toBeNull();
      expect(prismaMock.studentProfile.update).not.toHaveBeenCalled();
    });

    it("should update profile if it exists", async () => {
      const profileId = "profile_1";
      const updateData = {
        bio: "Updated bio that is long enough to meet the minimum character requirement for profiles in the system.",
        isActive: false,
      };

      prismaMock.studentProfile.findUnique.mockResolvedValue({ id: profileId });

      const mockUpdatedProfile = {
        id: profileId,
        userId: 1,
        university: "Test University",
        degree: "Test Degree",
        field: "LAW" as AcademicField,
        currentYear: 2,
        bio: updateData.bio,
        profilePhotoUrl: null,
        linkedInUrl: null,
        isActive: false,
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        averageRating: null,
        totalRatings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.studentProfile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await repository.updateProfile(profileId, updateData);

      expect(result).toEqual(mockUpdatedProfile);
      expect(prismaMock.studentProfile.update).toHaveBeenCalledWith({
        where: { id: profileId },
        data: updateData,
        select: expect.any(Object),
      });
    });

    it("should update partial fields", async () => {
      const profileId = "profile_1";
      prismaMock.studentProfile.findUnique.mockResolvedValue({ id: profileId });

      const mockUpdatedProfile = {
        id: profileId,
        userId: 1,
        university: "Updated University",
        degree: "Test Degree",
        field: "LAW" as AcademicField,
        currentYear: 2,
        bio: "Test bio",
        profilePhotoUrl: null,
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

      prismaMock.studentProfile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await repository.updateProfile(profileId, { university: "Updated University" });

      expect(result?.university).toBe("Updated University");
    });
  });

  describe("getProfile", () => {
    it("should return profile by ID", async () => {
      const profileId = "profile_1";
      const mockProfile = {
        id: profileId,
        userId: 1,
        university: "Test University",
        degree: "Test Degree",
        field: "LAW" as AcademicField,
        currentYear: 2,
        bio: "Test bio",
        profilePhotoUrl: null,
        linkedInUrl: null,
        isActive: true,
        totalSessions: 5,
        completedSessions: 4,
        cancelledSessions: 1,
        averageRating: null,
        totalRatings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.studentProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.getProfile(profileId);

      expect(result).toEqual(mockProfile);
      expect(prismaMock.studentProfile.findUnique).toHaveBeenCalledWith({
        where: { id: profileId },
        select: expect.any(Object),
      });
    });

    it("should return null if profile not found", async () => {
      prismaMock.studentProfile.findUnique.mockResolvedValue(null);

      const result = await repository.getProfile("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getProfileByUserId", () => {
    it("should return profile by user ID", async () => {
      const userId = 1;
      const mockProfile = {
        id: "profile_1",
        userId,
        university: "Test University",
        degree: "Test Degree",
        field: "LAW" as AcademicField,
        currentYear: 2,
        bio: "Test bio",
        profilePhotoUrl: null,
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

      prismaMock.studentProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.getProfileByUserId(userId);

      expect(result).toEqual(mockProfile);
      expect(prismaMock.studentProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
      });
    });

    it("should return null if no profile for user", async () => {
      prismaMock.studentProfile.findUnique.mockResolvedValue(null);

      const result = await repository.getProfileByUserId(999);

      expect(result).toBeNull();
    });
  });

  describe("getProfilesByField", () => {
    it("should return profiles filtered by field", async () => {
      const field = "LAW" as AcademicField;
      const mockProfiles = [
        {
          id: "profile_1",
          userId: 1,
          university: "University 1",
          degree: "Degree 1",
          field,
          currentYear: 2,
          bio: "Bio 1",
          profilePhotoUrl: null,
          linkedInUrl: null,
          isActive: true,
          totalSessions: 5,
          completedSessions: 4,
          cancelledSessions: 1,
          averageRating: null,
          totalRatings: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.studentProfile.findMany.mockResolvedValue(mockProfiles);
      prismaMock.studentProfile.count.mockResolvedValue(1);

      const result = await repository.getProfilesByField(field);

      expect(result.profiles).toEqual(mockProfiles);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledWith({
        where: { field, isActive: true },
        select: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: [{ totalSessions: "desc" }, { averageRating: "desc" }],
      });
    });

    it("should handle pagination", async () => {
      const field = "MEDICINE" as AcademicField;
      prismaMock.studentProfile.findMany.mockResolvedValue([]);
      prismaMock.studentProfile.count.mockResolvedValue(45);

      const result = await repository.getProfilesByField(field, { page: 2, pageSize: 10 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(45);
      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledWith({
        where: { field, isActive: true },
        select: expect.any(Object),
        skip: 10,
        take: 10,
        orderBy: expect.any(Array),
      });
    });

    it("should filter by university", async () => {
      const field = "ENGINEERING" as AcademicField;
      const university = "MIT";

      prismaMock.studentProfile.findMany.mockResolvedValue([]);
      prismaMock.studentProfile.count.mockResolvedValue(0);

      await repository.getProfilesByField(field, { university });

      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledWith({
        where: { field, isActive: true, university },
        select: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: expect.any(Array),
      });
    });

    it("should filter by minimum rating", async () => {
      const field = "BUSINESS" as AcademicField;
      const minRating = 4.5;

      prismaMock.studentProfile.findMany.mockResolvedValue([]);
      prismaMock.studentProfile.count.mockResolvedValue(0);

      await repository.getProfilesByField(field, { minRating });

      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledWith({
        where: { field, isActive: true, averageRating: { gte: minRating } },
        select: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: expect.any(Array),
      });
    });
  });

  describe("searchProfiles", () => {
    it("should search with multiple filters using AND logic", async () => {
      const query = {
        field: "LAW" as AcademicField,
        university: "Harvard",
        minRating: 4.0,
      };

      prismaMock.studentProfile.findMany.mockResolvedValue([]);
      prismaMock.studentProfile.count.mockResolvedValue(0);

      await repository.searchProfiles(query);

      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          field: query.field,
          university: query.university,
          averageRating: { gte: query.minRating },
        },
        select: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: [{ totalSessions: "desc" }, { averageRating: "desc" }],
      });
    });

    it("should search with only field filter", async () => {
      const query = { field: "MEDICINE" as AcademicField };

      prismaMock.studentProfile.findMany.mockResolvedValue([]);
      prismaMock.studentProfile.count.mockResolvedValue(0);

      await repository.searchProfiles(query);

      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledWith({
        where: { isActive: true, field: query.field },
        select: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: expect.any(Array),
      });
    });

    it("should search without filters (all active profiles)", async () => {
      prismaMock.studentProfile.findMany.mockResolvedValue([]);
      prismaMock.studentProfile.count.mockResolvedValue(0);

      await repository.searchProfiles({});

      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: expect.any(Array),
      });
    });
  });

  describe("updateStatistics", () => {
    it("should return null if profile does not exist", async () => {
      prismaMock.studentProfile.findUnique.mockResolvedValue(null);

      const result = await repository.updateStatistics("nonexistent", { totalSessions: 5 });

      expect(result).toBeNull();
      expect(prismaMock.studentProfile.update).not.toHaveBeenCalled();
    });

    it("should update statistics if profile exists", async () => {
      const profileId = "profile_1";
      prismaMock.studentProfile.findUnique.mockResolvedValue({ id: profileId });

      const mockUpdatedProfile = {
        id: profileId,
        userId: 1,
        university: "Test University",
        degree: "Test Degree",
        field: "LAW" as AcademicField,
        currentYear: 2,
        bio: "Test bio",
        profilePhotoUrl: null,
        linkedInUrl: null,
        isActive: true,
        totalSessions: 10,
        completedSessions: 8,
        cancelledSessions: 2,
        averageRating: null,
        totalRatings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.studentProfile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await repository.updateStatistics(profileId, {
        totalSessions: 10,
        completedSessions: 8,
        cancelledSessions: 2,
      });

      expect(result).toEqual(mockUpdatedProfile);
      expect(result?.totalSessions).toBe(10);
      expect(result?.completedSessions).toBe(8);
      expect(result?.cancelledSessions).toBe(2);
    });
  });
});
