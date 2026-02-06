import type { PrismaClient } from "@calcom/prisma";

export class CalendarsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getSelectedCalendarsByUserId(userId: number) {
    return this.prisma.selectedCalendar.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        integration: true,
        externalId: true,
        credentialId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getCredentialsByUserId(userId: number) {
    return this.prisma.credential.findMany({
      where: {
        userId,
        app: {
          categories: {
            has: "calendar",
          },
        },
      },
      select: {
        id: true,
        type: true,
        key: true,
        userId: true,
        appId: true,
        invalid: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }
}
