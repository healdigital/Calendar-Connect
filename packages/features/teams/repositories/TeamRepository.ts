import type { PrismaClient } from "@calcom/prisma";
import type { Prisma } from "@calcom/prisma/client";

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

  async findById({ id }: { id: number }) {
    return this.prisma.team.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        calVideoLogo: true,
        appLogo: true,
        appIconLogo: true,
        bio: true,
        hideBranding: true,
        hideTeamProfileLink: true,
        isPrivate: true,
        hideBookATeamMember: true,
        createdAt: true,
        metadata: true,
        theme: true,
        rrResetInterval: true,
        rrTimestampBasis: true,
        brandColor: true,
        darkBrandColor: true,
        bannerUrl: true,
        parentId: true,
        timeFormat: true,
        timeZone: true,
        weekStart: true,
        isOrganization: true,
        pendingPayment: true,
        isPlatform: true,
        createdByOAuthClientId: true,
        smsLockState: true,
        smsLockReviewedByAdmin: true,
        bookingLimits: true,
        includeManagedEventsInLimits: true,
        organizationSettings: {
          select: {
            id: true,
            isOrganizationVerified: true,
            isOrganizationConfigured: true,
            orgAutoAcceptEmail: true,
            lockEventTypeCreationForUsers: true,
            isAdminReviewed: true,
            isAdminAPIEnabled: true,
          },
        },
      },
    });
  }

  async getTeamById(teamId: number) {
    return this.prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        calVideoLogo: true,
        appLogo: true,
        appIconLogo: true,
        bio: true,
        hideBranding: true,
        hideTeamProfileLink: true,
        isPrivate: true,
        hideBookATeamMember: true,
        createdAt: true,
        metadata: true,
        theme: true,
        rrResetInterval: true,
        rrTimestampBasis: true,
        brandColor: true,
        darkBrandColor: true,
        bannerUrl: true,
        parentId: true,
        timeFormat: true,
        timeZone: true,
        weekStart: true,
        isOrganization: true,
        pendingPayment: true,
        isPlatform: true,
        createdByOAuthClientId: true,
        smsLockState: true,
        smsLockReviewedByAdmin: true,
        bookingLimits: true,
        includeManagedEventsInLimits: true,
      },
    });
  }

  async updateTeam(teamId: number, data: Prisma.TeamUpdateInput) {
    return this.prisma.team.update({
      where: {
        id: teamId,
      },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        calVideoLogo: true,
        appLogo: true,
        appIconLogo: true,
        bio: true,
        hideBranding: true,
        hideTeamProfileLink: true,
        isPrivate: true,
        hideBookATeamMember: true,
        createdAt: true,
        metadata: true,
        theme: true,
        rrResetInterval: true,
        rrTimestampBasis: true,
        brandColor: true,
        darkBrandColor: true,
        bannerUrl: true,
        parentId: true,
        timeFormat: true,
        timeZone: true,
        weekStart: true,
        isOrganization: true,
        pendingPayment: true,
        isPlatform: true,
        createdByOAuthClientId: true,
        smsLockState: true,
        smsLockReviewedByAdmin: true,
        bookingLimits: true,
        includeManagedEventsInLimits: true,
      },
    });
  }

  async isSlugAvailableForUpdate({
    slug,
    teamId,
    parentId,
  }: {
    slug: string;
    teamId: number;
    parentId: number | null;
  }): Promise<boolean> {
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        slug,
        id: {
          not: teamId,
        },
        parentId,
      },
      select: {
        id: true,
      },
    });

    return !existingTeam;
  }

  async findByIdIncludePlatformBilling({ id }: { id: number }) {
    return this.prisma.team.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        metadata: true,
        isPlatform: true,
        platformBilling: {
          select: {
            id: true,
            subscriptionId: true,
          },
        },
      },
    });
  }

  async findParentOrganizationByTeamId(teamId: number) {
    const team = await this.prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            isOrganization: true,
          },
        },
      },
    });

    if (!team?.parent) {
      return null;
    }

    return team.parent;
  }

  async findAllByParentId({ parentId, select }: { parentId: number; select?: Prisma.TeamSelect }) {
    return this.prisma.team.findMany({
      where: {
        parentId,
      },
      select: select || {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  async findByIdAndParentId({
    id,
    parentId,
    select,
  }: {
    id: number;
    parentId: number;
    select?: Prisma.TeamSelect;
  }) {
    return this.prisma.team.findFirst({
      where: {
        id,
        parentId,
      },
      select: select || {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  async findFirstBySlugAndParentSlug({
    slug,
    parentSlug,
    select,
  }: {
    slug: string;
    parentSlug: string | null;
    select?: Prisma.TeamSelect;
  }) {
    return this.prisma.team.findFirst({
      where: {
        slug,
        parent: parentSlug
          ? {
              slug: parentSlug,
            }
          : {
              is: null,
            },
      },
      select: select || {
        id: true,
      },
    });
  }
}
