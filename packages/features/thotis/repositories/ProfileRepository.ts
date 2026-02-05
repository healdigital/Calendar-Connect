import prisma from "@calcom/prisma";
import type { AcademicField } from "@calcom/prisma/enums";
import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * ProfileRepository handles all database operations for StudentProfile entities.
 * Following Cal.com conventions:
 * - Uses `select` instead of `include` for performance and security
 * - Uses early returns for null checks
 * - No business logic (that belongs in Services)
 */
export class ProfileRepository {
  private prismaClient: PrismaClient;

  constructor(deps?: { prismaClient?: PrismaClient }) {
    this.prismaClient = deps?.prismaClient || prisma;
  }

  /**
   * Create a new student profile
   * @param userId - The user ID to associate with the profile
   * @param data - Profile data
   * @returns The created profile
   */
  async createProfile(
    userId: number,
    data: {
      university: string;
      degree: string;
      field: AcademicField;
      currentYear: number;
      bio: string;
      profilePhotoUrl?: string | null;
      linkedInUrl?: string | null;
    }
  ) {
    return this.prismaClient.studentProfile.create({
      data: {
        userId,
        university: data.university,
        degree: data.degree,
        field: data.field,
        currentYear: data.currentYear,
        bio: data.bio,
        profilePhotoUrl: data.profilePhotoUrl,
        linkedInUrl: data.linkedInUrl,
      },
      select: {
        id: true,
        userId: true,
        university: true,
        degree: true,
        field: true,
        currentYear: true,
        bio: true,
        profilePhotoUrl: true,
        linkedInUrl: true,
        isActive: true,
        totalSessions: true,
        completedSessions: true,
        cancelledSessions: true,
        averageRating: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update an existing student profile
   * @param profileId - The profile ID to update
   * @param data - Partial profile data to update
   * @returns The updated profile or null if not found
   */
  async updateProfile(
    profileId: string,
    data: {
      university?: string;
      degree?: string;
      field?: AcademicField;
      currentYear?: number;
      bio?: string;
      profilePhotoUrl?: string | null;
      linkedInUrl?: string | null;
      isActive?: boolean;
    }
  ) {
    // Check if profile exists first (early return pattern)
    const existing = await this.prismaClient.studentProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });

    if (!existing) return null;

    return this.prismaClient.studentProfile.update({
      where: { id: profileId },
      data,
      select: {
        id: true,
        userId: true,
        university: true,
        degree: true,
        field: true,
        currentYear: true,
        bio: true,
        profilePhotoUrl: true,
        linkedInUrl: true,
        isActive: true,
        totalSessions: true,
        completedSessions: true,
        cancelledSessions: true,
        averageRating: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get a profile by ID
   * @param profileId - The profile ID
   * @returns The profile or null if not found
   */
  async getProfile(profileId: string) {
    return this.prismaClient.studentProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        userId: true,
        university: true,
        degree: true,
        field: true,
        currentYear: true,
        bio: true,
        profilePhotoUrl: true,
        linkedInUrl: true,
        isActive: true,
        totalSessions: true,
        completedSessions: true,
        cancelledSessions: true,
        averageRating: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get a profile by user ID
   * @param userId - The user ID
   * @returns The profile or null if not found
   */
  async getProfileByUserId(userId: number) {
    return this.prismaClient.studentProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        university: true,
        degree: true,
        field: true,
        currentYear: true,
        bio: true,
        profilePhotoUrl: true,
        linkedInUrl: true,
        isActive: true,
        totalSessions: true,
        completedSessions: true,
        cancelledSessions: true,
        averageRating: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get profiles by academic field with pagination
   * @param field - The academic field to filter by
   * @param options - Pagination options
   * @returns Array of profiles and total count
   */
  async getProfilesByField(
    field: AcademicField,
    options: {
      page?: number;
      pageSize?: number;
      university?: string;
      minRating?: number;
    } = {}
  ) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.StudentProfileWhereInput = {
      field,
      isActive: true,
    };

    if (options.university) {
      where.university = options.university;
    }

    if (options.minRating !== undefined) {
      where.averageRating = {
        gte: options.minRating,
      };
    }

    // Execute queries in parallel
    const [profiles, total] = await Promise.all([
      this.prismaClient.studentProfile.findMany({
        where,
        select: {
          id: true,
          userId: true,
          university: true,
          degree: true,
          field: true,
          currentYear: true,
          bio: true,
          profilePhotoUrl: true,
          linkedInUrl: true,
          isActive: true,
          totalSessions: true,
          completedSessions: true,
          cancelledSessions: true,
          averageRating: true,
          totalRatings: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: pageSize,
        orderBy: [
          // Order by availability (more sessions available = higher priority)
          { totalSessions: "desc" },
          { averageRating: "desc" },
        ],
      }),
      this.prismaClient.studentProfile.count({ where }),
    ]);

    return {
      profiles,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Search profiles with multiple filters
   * @param query - Search query with filters
   * @returns Array of profiles and total count
   */
  async searchProfiles(query: {
    field?: AcademicField;
    university?: string;
    minRating?: number;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause with AND logic for multiple filters
    const where: Prisma.StudentProfileWhereInput = {
      isActive: true,
    };

    if (query.field) {
      where.field = query.field;
    }

    if (query.university) {
      where.university = query.university;
    }

    if (query.minRating !== undefined) {
      where.averageRating = {
        gte: query.minRating,
      };
    }

    // Execute queries in parallel
    const [profiles, total] = await Promise.all([
      this.prismaClient.studentProfile.findMany({
        where,
        select: {
          id: true,
          userId: true,
          university: true,
          degree: true,
          field: true,
          currentYear: true,
          bio: true,
          profilePhotoUrl: true,
          linkedInUrl: true,
          isActive: true,
          totalSessions: true,
          completedSessions: true,
          cancelledSessions: true,
          averageRating: true,
          totalRatings: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: pageSize,
        orderBy: [{ totalSessions: "desc" }, { averageRating: "desc" }],
      }),
      this.prismaClient.studentProfile.count({ where }),
    ]);

    return {
      profiles,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Update profile statistics
   * @param profileId - The profile ID
   * @param data - Statistics to update
   * @returns The updated profile or null if not found
   */
  async updateStatistics(
    profileId: string,
    data: {
      totalSessions?: number;
      completedSessions?: number;
      cancelledSessions?: number;
      averageRating?: number | null;
      totalRatings?: number;
    }
  ) {
    // Check if profile exists first (early return pattern)
    const existing = await this.prismaClient.studentProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });

    if (!existing) return null;

    return this.prismaClient.studentProfile.update({
      where: { id: profileId },
      data,
      select: {
        id: true,
        userId: true,
        university: true,
        degree: true,
        field: true,
        currentYear: true,
        bio: true,
        profilePhotoUrl: true,
        linkedInUrl: true,
        isActive: true,
        totalSessions: true,
        completedSessions: true,
        cancelledSessions: true,
        averageRating: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  /**
   * Get platform-wide statistics aggregation
   * @returns Aggregated statistics
   */
  async getPlatformAggregates() {
    return this.prismaClient.studentProfile.aggregate({
      where: { isActive: true },
      _sum: {
        totalSessions: true,
        completedSessions: true,
        cancelledSessions: true,
        totalRatings: true,
      },
      _avg: {
        averageRating: true,
      },
      _count: {
        id: true,
      },
    });
  }

  /**
   * Get booking trends
   * Requirement 20.3: Session trends
   */
  async getBookingTrends() {
    // Placeholder implementation for trends
    // In production, this would use raw SQL or specialized analytics store
    return {
      daily: [],
      weekly: [],
      monthly: [],
    };
  }
}
