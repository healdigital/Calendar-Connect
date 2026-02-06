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
        prospectiveEmail: data.prospectiveEmail || "",
      },
      include: {
        booking: true,
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

  async findByBookingId(bookingId: number) {
    return this.prismaClient.sessionRating.findUnique({
      where: { bookingId },
      include: {
        booking: true,
      },
    });
  }

  async findByStudentProfileId(studentProfileId: string) {
    return this.prismaClient.sessionRating.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRatingStats(studentProfileId: string) {
    const [average, count, distribution] = await Promise.all([
      this.getAverageRating(studentProfileId),
      this.prismaClient.sessionRating.count({
        where: { studentProfileId },
      }),
      this.prismaClient.sessionRating.groupBy({
        by: ["rating"],
        where: { studentProfileId },
        _count: { rating: true },
      }),
    ]);

    const formattedDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: distribution.find((d) => d.rating === rating)?._count.rating || 0,
    }));

    return {
      average,
      count,
      distribution: formattedDistribution,
    };
  }

  async updateRating(id: string, data: { rating?: number; feedback?: string | null }) {
    return this.prismaClient.sessionRating.update({
      where: { id },
      data,
    });
  }

  async deleteRating(id: string) {
    return this.prismaClient.sessionRating.delete({
      where: { id },
    });
  }
}
