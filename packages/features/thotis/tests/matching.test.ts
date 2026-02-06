import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRepository } from "../repositories/ProfileRepository";
import { ProfileService } from "../services/ProfileService"; // Adjust import path

// Mock ProfileRepository
const mockRepository = {
  searchProfiles: vi.fn(),
  getTopRatedProfiles: vi.fn(),
  getRecommendedProfilesByIntent: vi.fn(),
  getProfileByUserId: vi.fn(),
};

describe("Thotis Matching & Discovery Backend", () => {
  let service: ProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProfileService(mockRepository as any);
  });

  describe("searchProfiles", () => {
    it("should pass filter parameters correctly to repository", async () => {
      const filters = {
        query: "Computer Science",
        expertise: ["React", "Node.js"],
        sort: "rating" as const,
        minRating: 4,
      };

      const mockResult = {
        profiles: [],
        total: 0,
        page: 1,
        pageSize: 20,
      };

      mockRepository.searchProfiles.mockResolvedValue(mockResult);

      await service.searchProfiles(filters);

      expect(mockRepository.searchProfiles).toHaveBeenCalledWith({
        query: "Computer Science",
        field: undefined,
        expertise: ["React", "Node.js"],
        university: undefined,
        minRating: 4,
        page: undefined,
        pageSize: undefined,
        sort: "rating",
      });
    });

    it("should handle default sort and pagination", async () => {
      const mockResult = {
        profiles: [],
        total: 0,
        page: 1,
        pageSize: 20,
      };

      mockRepository.searchProfiles.mockResolvedValue(mockResult);

      await service.searchProfiles({});

      expect(mockRepository.searchProfiles).toHaveBeenCalledWith({
        query: undefined,
        field: undefined,
        expertise: undefined,
        university: undefined,
        minRating: undefined,
        page: undefined,
        pageSize: undefined,
        sort: undefined,
      });
    });
  });

  describe("Recommendations", () => {
    it("should call getTopRatedProfiles for top mentors", async () => {
      mockRepository.getTopRatedProfiles.mockResolvedValue([]);
      await service.getTopRatedProfiles();
      expect(mockRepository.getTopRatedProfiles).toHaveBeenCalled();
    });

    it("should call getRecommendedProfilesByIntent with intent", async () => {
      const intent = {
        targetFields: ["COMPUTER_SCIENCE"],
        academicLevel: "BACHELOR",
        goals: ["React"],
        scheduleConstraints: { preferredTimes: ["weekdays"] },
      };
      mockRepository.getRecommendedProfilesByIntent.mockResolvedValue([]);
      await service.getRecommendedProfilesByIntent(intent);
      expect(mockRepository.getRecommendedProfilesByIntent).toHaveBeenCalledWith(intent);
    });
  });

  describe("MentorMatchingService", () => {
    it("should score mentor higher with goal match", async () => {
      const { MentorMatchingService } = await import("../services/MentorMatchingService");
      const matchingService = new MentorMatchingService();

      const mentorBase = {
        field: "COMPUTER_SCIENCE",
        expertise: ["React", "Node.js"],
        currentYear: 3,
        isActive: true,
        totalSessions: 15,
        completedSessions: 14,
        averageRating: 4.9,
      } as any;

      const intentWithGoal = {
        targetFields: ["COMPUTER_SCIENCE"],
        goals: ["React"],
        scheduleConstraints: { preferredTimes: ["weekdays"] },
      } as any;

      const intentWithoutGoal = {
        targetFields: ["COMPUTER_SCIENCE"],
        goals: ["Law"],
        scheduleConstraints: { preferredTimes: ["weekdays"] },
      } as any;

      const scoredWithGoal = matchingService.scoreMentor(mentorBase, intentWithGoal);
      const scoredWithoutGoal = matchingService.scoreMentor(mentorBase, intentWithoutGoal);

      expect(scoredWithGoal.matchScore).toBeGreaterThan(scoredWithoutGoal.matchScore);
      expect(scoredWithGoal.matchReasons).toContain("Expert in: React");
    });
  });
});
