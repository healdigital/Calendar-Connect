import prisma from "@calcom/prisma";
import type { Prisma, PrismaClient } from "@calcom/prisma/client";
import { type AcademicField, MentorStatus } from "@calcom/prisma/enums";

const studentProfileSelect = {
  id: true,
  userId: true,
  university: true,
  degree: true,
  field: true,
  expertise: true,
  currentYear: true,
  bio: true,
  profilePhotoUrl: true,
  linkedInUrl: true,
  isActive: true,
  status: true,
  totalSessions: true,
  completedSessions: true,
  cancelledSessions: true,
  averageRating: true,
  totalRatings: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      name: true,
      username: true,
      avatarUrl: true,
      profiles: {
        select: {
          organization: {
            select: {
              id: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.StudentProfileSelect;

export type StudentProfileWithUser = Prisma.StudentProfileGetPayload<{
  select: typeof studentProfileSelect;
}>;

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
      expertise?: string[];
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
        expertise: data.expertise || [],
        currentYear: data.currentYear,
        bio: data.bio,
        profilePhotoUrl: data.profilePhotoUrl,
        linkedInUrl: data.linkedInUrl,
        status: "VERIFIED",
      },
      select: studentProfileSelect,
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
      expertise?: string[];
      currentYear?: number;
      bio?: string;
      profilePhotoUrl?: string | null;
      linkedInUrl?: string | null;
      isActive?: boolean;
      status?: MentorStatus;
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
      select: studentProfileSelect,
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
      select: studentProfileSelect,
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
      select: studentProfileSelect,
    });
  }

  /**
   * Get a profile by username
   * @param username - The username
   * @returns The profile or null if not found
   */
  async getProfileByUsername(username: string) {
    return this.prismaClient.studentProfile.findFirst({
      where: { user: { username } },
      select: studentProfileSelect,
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
    return this.searchProfiles({
      field,
      university: options.university,
      minRating: options.minRating,
      page: options.page,
      pageSize: options.pageSize,
    });
  }

  /**
   * Search profiles with multiple filters
   * @param query - Search parameters
   * @returns Array of profiles and total count
   */
  async searchProfiles(query: {
    query?: string;
    field?: AcademicField;
    expertise?: string[];
    university?: string;
    minRating?: number;
    page?: number;
    pageSize?: number;
    sort?: "rating" | "popularity" | "newest";
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.StudentProfileWhereInput = {
      status: MentorStatus.VERIFIED,
      isActive: true, // Keep checking isActive for backward compatibility if needed, or remove? Plan says deprecate. But safe to keep both for now if data migration isn't perfect.
      // Actually, if I rely on status, I should trust status. But existing active might imply isActive.
      // Let's use status only if I am sure. But since I added status with default PENDING, filtering by VERIFIED means NO ONE will appear until verified.
      // This is expected for "Quality Workflow".
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

    if (query.expertise && query.expertise.length > 0) {
      where.expertise = {
        hasSome: query.expertise,
      };
    }

    if (query.query) {
      where.OR = [
        { bio: { contains: query.query, mode: "insensitive" } },
        { university: { contains: query.query, mode: "insensitive" } },
        { degree: { contains: query.query, mode: "insensitive" } },
        { user: { name: { contains: query.query, mode: "insensitive" } } },
      ];
    }

    // Determine sort order
    let orderBy: Prisma.StudentProfileOrderByWithRelationInput[] = [];
    if (query.sort === "rating") {
      orderBy = [{ averageRating: "desc" }, { totalRatings: "desc" }];
    } else if (query.sort === "popularity") {
      orderBy = [{ totalSessions: "desc" }];
    } else if (query.sort === "newest") {
      orderBy = [{ createdAt: "desc" }];
    } else {
      // Default sort
      orderBy = [{ totalSessions: "desc" }, { averageRating: "desc" }];
    }

    // Execute queries in parallel
    const [profiles, total] = await Promise.all([
      this.prismaClient.studentProfile.findMany({
        where,
        select: studentProfileSelect,
        skip,
        take: pageSize,
        orderBy,
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
   * Get top rated profiles
   */
  async getTopRatedProfiles(limit: number = 5) {
    return this.prismaClient.studentProfile.findMany({
      where: {
        status: MentorStatus.VERIFIED,
        averageRating: { gte: 4.5 },
      },
      orderBy: [{ averageRating: "desc" }, { totalRatings: "desc" }],
      take: limit,
      select: studentProfileSelect,
    });
  }

  /**
   * Get recommended profiles based on field overlap or other criteria
   */
  async getRecommendedProfiles(field?: AcademicField, limit: number = 3) {
    const baseWhere: Prisma.StudentProfileWhereInput = { status: MentorStatus.VERIFIED };

    if (!field) {
      // Generic recommendations: high rating and popular
      return this.prismaClient.studentProfile.findMany({
        where: baseWhere,
        orderBy: [{ averageRating: "desc" }, { totalSessions: "desc" }],
        take: limit,
        select: studentProfileSelect,
      });
    }

    // Personalized recommendations: prioritized by requested field
    // Then by rating and popularity
    const profiles = await this.prismaClient.studentProfile.findMany({
      where: baseWhere,
      orderBy: [
        // This is a bit tricky with Prisma alone for a "priority" sort
        // We can do it by field match first
        {
          field: "desc", // This doesn't really work as a boolean check in Prisma orderBy
        },
      ],
      select: studentProfileSelect,
    });

    // Custom sorting: Field match first, then Rating, then Popularity
    const sorted = profiles.sort((a, b) => {
      const aFieldMatch = a.field === field;
      const bFieldMatch = b.field === field;

      if (aFieldMatch && !bFieldMatch) return -1;
      if (!aFieldMatch && bFieldMatch) return 1;

      // Both match or both don't match, sort by rating
      const aRating = Number(a.averageRating || 0);
      const bRating = Number(b.averageRating || 0);
      if (bRating !== aRating) return bRating - aRating;

      // Finally by total sessions
      return (b.totalSessions || 0) - (a.totalSessions || 0);
    });

    return sorted.slice(0, limit);
  }

  /**
   * Get recommended profiles based on orientation intent
   */
  async getRecommendedProfilesByIntent(
    intent: {
      targetFields: string[];
      academicLevel: string;
      zone?: string | null;
    },
    limit: number = 10
  ) {
    // Basic filtering at DB level to reduce result set
    // We fetch more than limit to allow the service to score and sort
    const where: Prisma.StudentProfileWhereInput = {
      status: MentorStatus.VERIFIED,
      OR: [
        // Match by any of the target fields
        {
          field: {
            in: intent.targetFields as AcademicField[],
          },
        },
        // Or generic fallback (we can filter/score later)
        {
          averageRating: { gte: 4.0 },
        },
      ],
    };

    return this.prismaClient.studentProfile.findMany({
      where,
      take: 50, // Fetch candidates for scoring
      select: studentProfileSelect,
    });
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
      select: studentProfileSelect,
    });
  }
  /**
   * Get platform-wide statistics aggregation
   * @returns Aggregated statistics
   */
  async getPlatformAggregates() {
    return this.prismaClient.studentProfile.aggregate({
      where: { status: MentorStatus.VERIFIED },
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
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const last12Weeks = new Date();
    last12Weeks.setDate(last12Weeks.getDate() - 84); // 12 * 7

    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 12);

    // Fetch all bookings for trends (daily is 30 days, weekly/monthly can be more)
    const allBookings = await this.prismaClient.booking.findMany({
      where: {
        startTime: { gte: last12Months },
        eventType: {
          metadata: {
            path: ["isThotisSession"],
            equals: true,
          },
        },
      },
      select: {
        startTime: true,
      },
    });

    // Daily Map (Last 30 days)
    const dailyMap: Record<string, number> = {};
    // Weekly Map (Last 12 weeks)
    const weeklyMap: Record<string, number> = {};
    // Monthly Map (Last 12 months)
    const monthlyMap: Record<string, number> = {};

    allBookings.forEach((b) => {
      const date = b.startTime.toISOString().split("T")[0];
      const month = date.substring(0, 7); // YYYY-MM

      // Week calculation
      const d = new Date(b.startTime);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      const week = `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;

      if (b.startTime >= last30Days) {
        dailyMap[date] = (dailyMap[date] || 0) + 1;
      }
      if (b.startTime >= last12Weeks) {
        weeklyMap[week] = (weeklyMap[week] || 0) + 1;
      }
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });

    const daily = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const weekly = Object.entries(weeklyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const monthly = Object.entries(monthlyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      daily,
      weekly,
      monthly,
    };
  }

  /**
   * Get distribution of profiles by academic field
   */
  async getFieldDistribution() {
    return this.prismaClient.studentProfile.groupBy({
      by: ["field"],
      _count: {
        id: true,
      },
      where: {
        status: MentorStatus.VERIFIED,
      },
    });
  }

  /**
   * Upsert a student orientation intent
   */
  async upsertOrientationIntent(
    userId: number,
    data: {
      targetFields: string[];
      academicLevel: string;
      zone?: string | null;
      goals?: string[];
      scheduleConstraints?: any;
    }
  ) {
    return this.prismaClient.thotisOrientationIntent.upsert({
      where: {
        userId,
      },
      update: {
        targetFields: data.targetFields,
        academicLevel: data.academicLevel,
        zone: data.zone,
        goals: data.goals || [],
        scheduleConstraints: data.scheduleConstraints,
      },
      create: {
        userId,
        targetFields: data.targetFields,
        academicLevel: data.academicLevel,
        zone: data.zone,
        goals: data.goals || [],
        scheduleConstraints: data.scheduleConstraints,
      },
    });
  }
}
