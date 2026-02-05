import prisma from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma/client";

export class SessionRatingRepository {
  private prismaClient: PrismaClient;

  constructor(deps?: { prismaClient?: PrismaClient }) {
    this.prismaClient = deps?.prismaClient || prisma;
  }

  async createRating(data: {
    bookingId: number;
    studentProfileId: string;
    rating: number;
    feedback?: string | null;
    prospectiveEmail?: string;
  }) {
    // If prospectiveEmail is missing, we might need to fetch it from booking,
    // but typically repositories blindly save what is passed.
    // We'll allow undefined here to satisfy StatisticsService usage,
    // assuming the Prisma model might have it optional or it's handled elsewhere.
    return this.prismaClient.sessionRating.create({
      data: {
        bookingId: data.bookingId,
        studentProfileId: data.studentProfileId,
        rating: data.rating,
        feedback: data.feedback,
        prospectiveEmail: data.prospectiveEmail || "", // Fallback if required and not passed
      },
    });
  }

  async getAverageRating(studentProfileId: string): Promise<number | null> {
    const aggregate = await this.prismaClient.sessionRating.aggregate({
      where: {
        studentProfileId,
      },
      _avg: {
        rating: true,
      },
    });

    return aggregate._avg.rating;
  }
}
