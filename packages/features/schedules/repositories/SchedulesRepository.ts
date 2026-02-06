import type { PrismaClient } from "@calcom/prisma";

export class SchedulesRepository {
  constructor(private readonly prismaClient: PrismaClient) {
    if (!prismaClient) {
      throw new Error("PrismaClient is required for SchedulesRepository");
    }
  }

  async createSchedule({ userId, name, timeZone }: { userId: number; name: string; timeZone: string }) {
    return this.prismaClient.schedule.create({
      data: {
        userId,
        name,
        timeZone,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        timeZone: true,
      },
    });
  }

  async createScheduleWithAvailability({
    userId,
    name,
    timeZone,
    availability,
  }: {
    userId: number;
    name: string;
    timeZone: string;
    availability: Array<{
      days: number[];
      startTime: Date;
      endTime: Date;
    }>;
  }) {
    return this.prismaClient.schedule.create({
      data: {
        userId,
        name,
        timeZone,
        availability: {
          createMany: {
            data: availability,
          },
        },
      },
      select: {
        id: true,
        userId: true,
        name: true,
        timeZone: true,
        availability: {
          select: {
            id: true,
            days: true,
            startTime: true,
            endTime: true,
            date: true,
          },
        },
      },
    });
  }

  async getScheduleById(scheduleId: number) {
    return this.prismaClient.schedule.findUnique({
      where: {
        id: scheduleId,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        timeZone: true,
        availability: {
          select: {
            id: true,
            days: true,
            startTime: true,
            endTime: true,
            date: true,
          },
        },
      },
    });
  }

  async updateSchedule({
    scheduleId,
    name,
    timeZone,
  }: {
    scheduleId: number;
    name?: string;
    timeZone?: string;
  }) {
    return this.prismaClient.schedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        ...(name && { name }),
        ...(timeZone && { timeZone }),
      },
      select: {
        id: true,
        userId: true,
        name: true,
        timeZone: true,
      },
    });
  }

  async deleteSchedule(scheduleId: number) {
    return this.prismaClient.schedule.delete({
      where: {
        id: scheduleId,
      },
    });
  }

  async getSchedulesByUserId(userId: number) {
    return this.prismaClient.schedule.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        timeZone: true,
        availability: {
          select: {
            id: true,
            days: true,
            startTime: true,
            endTime: true,
            date: true,
          },
        },
      },
    });
  }

  async setDefaultSchedule(userId: number, scheduleId: number) {
    return this.prismaClient.user.update({
      where: {
        id: userId,
      },
      data: {
        defaultScheduleId: scheduleId,
      },
      select: {
        id: true,
        defaultScheduleId: true,
      },
    });
  }
}
