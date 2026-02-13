import type { PrismaClient } from "@calcom/prisma";

/**
 * EventTypesRepository_2024_04_15
 *
 * Repository for event type data access operations (2024-04-15 API version)
 */
export class EventTypesRepository_2024_04_15 {
  constructor(private readonly prisma: PrismaClient) {}

  async getEventTypeWithSeats(eventTypeId: number) {
    return await this.prisma.eventType.findUnique({
      where: {
        id: eventTypeId,
      },
      select: {
        id: true,
        slug: true,
        teamId: true,
        seatsPerTimeSlot: true,
        users: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async getEventTypeById(eventTypeId: number) {
    return await this.prisma.eventType.findUnique({
      where: {
        id: eventTypeId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        length: true,
        hidden: true,
        userId: true,
        teamId: true,
        locations: true,
        eventName: true,
        timeZone: true,
        periodType: true,
        periodStartDate: true,
        periodEndDate: true,
        periodDays: true,
        periodCountCalendarDays: true,
        requiresConfirmation: true,
        recurringEvent: true,
        disableGuests: true,
        hideCalendarNotes: true,
        minimumBookingNotice: true,
        beforeEventBuffer: true,
        afterEventBuffer: true,
        slotInterval: true,
        metadata: true,
        successRedirectUrl: true,
        currency: true,
        bookingFields: true,
        scheduleId: true,
        price: true,
        seatsPerTimeSlot: true,
        seatsShowAttendees: true,
        seatsShowAvailabilityCount: true,
        bookingLimits: true,
        durationLimits: true,
        offsetStart: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            timeZone: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async createEventType(data: {
    title: string;
    slug: string;
    length: number;
    userId?: number;
    teamId?: number;
    hidden?: boolean;
    description?: string;
  }) {
    return await this.prisma.eventType.create({
      data: {
        title: data.title,
        slug: data.slug,
        length: data.length,
        ...(data.userId ? { owner: { connect: { id: data.userId } } } : {}),
        ...(data.teamId ? { team: { connect: { id: data.teamId } } } : {}),
        ...(data.hidden !== undefined ? { hidden: data.hidden } : {}),
        ...(data.description ? { description: data.description } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        length: true,
        hidden: true,
        userId: true,
        teamId: true,
      },
    });
  }

  async updateEventType(
    eventTypeId: number,
    data: {
      title?: string;
      slug?: string;
      length?: number;
      hidden?: boolean;
      description?: string;
    }
  ) {
    return await this.prisma.eventType.update({
      where: {
        id: eventTypeId,
      },
      data,
      select: {
        id: true,
        title: true,
        slug: true,
        length: true,
        hidden: true,
        description: true,
      },
    });
  }

  async deleteEventType(eventTypeId: number) {
    return await this.prisma.eventType.delete({
      where: {
        id: eventTypeId,
      },
      select: {
        id: true,
        title: true,
      },
    });
  }
}
