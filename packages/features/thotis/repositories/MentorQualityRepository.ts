import prisma from "@calcom/prisma";
import type { Prisma, PrismaClient } from "@calcom/prisma/client";
import type { MentorIncidentType, MentorModerationActionType } from "@calcom/prisma/enums";

export class MentorQualityRepository {
  private prismaClient: PrismaClient;

  constructor(deps?: { prismaClient?: PrismaClient }) {
    this.prismaClient = deps?.prismaClient || prisma;
  }

  /**
   * List quality incidents with pagination and filters
   */
  async listIncidents(filters: {
    page?: number;
    pageSize?: number;
    studentProfileId?: string;
    type?: MentorIncidentType;
    resolved?: boolean;
  }) {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.MentorQualityIncidentWhereInput = {};
    if (filters.studentProfileId) where.studentProfileId = filters.studentProfileId;
    if (filters.type) where.type = filters.type;
    if (filters.resolved !== undefined) where.resolved = filters.resolved;

    const [incidents, total] = await Promise.all([
      this.prismaClient.mentorQualityIncident.findMany({
        where,
        include: {
          studentProfile: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          reportedByUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prismaClient.mentorQualityIncident.count({ where }),
    ]);

    return { incidents, total, page, pageSize };
  }

  /**
   * Get an incident by ID
   */
  async getIncidentById(id: string) {
    return this.prismaClient.mentorQualityIncident.findUnique({
      where: { id },
      include: {
        studentProfile: true,
      },
    });
  }

  /**
   * Update an incident (e.g., mark as resolved)
   */
  async updateIncident(id: string, data: Prisma.MentorQualityIncidentUpdateInput) {
    return this.prismaClient.mentorQualityIncident.update({
      where: { id },
      data,
    });
  }

  /**
   * Create a moderation action
   */
  async createModerationAction(data: {
    studentProfileId: string;
    actionByUserId: number;
    actionType: MentorModerationActionType;
    reason?: string;
  }) {
    return this.prismaClient.mentorModerationAction.create({
      data,
    });
  }

  /**
   * List moderation actions for a profile
   */
  async listModerationActions(studentProfileId: string) {
    return this.prismaClient.mentorModerationAction.findMany({
      where: { studentProfileId },
      include: {
        actionByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
