import type { PrismaClient } from "@calcom/prisma";

export class TeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findTeamBySlugWithAdminRole(slug: string, userId: number) {
    return this.prisma.team.findFirst({
      where: {
        slug,
        members: {
          some: {
            userId,
            role: {
              in: ["ADMIN", "OWNER"],
            },
          },
        },
      },
    });
  }

  async findOrganizationSettingsBySlug(_args: { slug: string }) {
    return null;
  }

  async findTeamSlugById(_args: { id: number }) {
    return null;
  }

  async findOwnedTeamsByUserId({ userId }: { userId: number }) {
    return this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
            role: {
              in: ["OWNER", "ADMIN"],
            },
          },
        },
      },
    });
  }
}
