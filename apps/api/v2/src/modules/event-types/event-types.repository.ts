import { Injectable } from "@nestjs/common";
import { PrismaReadService } from "@/modules/prisma/prisma-read.service";

@Injectable()
export class EventTypesRepository {
  constructor(private readonly prisma: PrismaReadService) {}

  async getEventTypeWithHosts(eventTypeId: number) {
    return this.prisma.prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: {
        hosts: {
          include: {
            user: true,
          },
        },
        users: true, // For team events where users might be assigned directly or implicitly
        owner: true,
      },
    });
  }

  async getEventTypeById(id: number) {
    return this.prisma.prisma.eventType.findUnique({
      where: { id },
    });
  }

  async isUserHostOfEventType(userId: number, eventTypeId: number): Promise<boolean> {
    const count = await this.prisma.prisma.host.count({
      where: {
        userId,
        eventTypeId,
      },
    });
    return count > 0;
  }

  async isUserAssignedToEventType(userId: number, eventTypeId: number): Promise<boolean> {
    // Check if user is a host or owner.
    // Simplified logic for open source usually implies being a host or the owner.
    const eventType = await this.prisma.prisma.eventType.findUnique({
      where: { id: eventTypeId },
      select: { userId: true },
    });

    if (eventType?.userId === userId) return true;

    return this.isUserHostOfEventType(userId, eventTypeId);
  }
}
