import type { PrismaClient } from "@calcom/prisma";
import type { CreateScheduleInput_2024_04_15 } from "../inputs/CreateScheduleInput_2024_04_15";
import { SchedulesRepository } from "../repositories/SchedulesRepository";

const DEFAULT_AVAILABILITY = [
  {
    days: [1],
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
  {
    days: [2],
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
  {
    days: [3],
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
  {
    days: [4],
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
  {
    days: [5],
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
];

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function parseTimeString(timeString: string): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date("1970-01-01T00:00:00.000Z");
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

function convertAvailabilityInput(availability: CreateScheduleInput_2024_04_15["availability"]) {
  if (!availability) {
    return DEFAULT_AVAILABILITY;
  }

  return availability.map((slot) => ({
    days: slot.days.map((day) => DAY_NAME_TO_NUMBER[day]),
    startTime: parseTimeString(slot.startTime),
    endTime: parseTimeString(slot.endTime),
  }));
}

export class SchedulesService_2024_04_15 {
  private repository: SchedulesRepository;

  constructor(private readonly prismaClient: PrismaClient) {
    this.repository = new SchedulesRepository(prismaClient);
  }

  async createUserSchedule(userId: number, input: CreateScheduleInput_2024_04_15) {
    const availability = convertAvailabilityInput(input.availability);

    const schedule = await this.repository.createScheduleWithAvailability({
      userId,
      name: input.name,
      timeZone: input.timeZone,
      availability,
    });

    if (input.isDefault) {
      await this.repository.setDefaultSchedule(userId, schedule.id);
    }

    return schedule;
  }

  async getScheduleById(scheduleId: number) {
    return this.repository.getScheduleById(scheduleId);
  }

  async updateSchedule(scheduleId: number, input: Partial<CreateScheduleInput_2024_04_15>) {
    return this.repository.updateSchedule({
      scheduleId,
      name: input.name,
      timeZone: input.timeZone,
    });
  }

  async deleteSchedule(scheduleId: number) {
    return this.repository.deleteSchedule(scheduleId);
  }

  async getUserSchedules(userId: number) {
    return this.repository.getSchedulesByUserId(userId);
  }
}
