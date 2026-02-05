import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRepository } from "../repositories/ProfileRepository";
import { ProfileService } from "../services/ProfileService"; // Adjust import path

// Mock ProfileRepository
const mockRepository = {
  searchProfiles: vi.fn(),
  getTopRatedProfiles: vi.fn(),
  getRecommendedProfiles: vi.fn(),
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

    it("should call getRecommendedProfiles with field", async () => {
      mockRepository.getRecommendedProfiles.mockResolvedValue([]);
      await service.getRecommendedProfiles("COMPUTER_SCIENCE");
      expect(mockRepository.getRecommendedProfiles).toHaveBeenCalledWith("COMPUTER_SCIENCE");
    });
  });
});
