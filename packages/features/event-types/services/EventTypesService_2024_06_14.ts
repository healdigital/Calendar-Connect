import type { PrismaClient } from "@calcom/prisma";
import { Injectable } from "@nestjs/common";
import { EventTypesRepository_2024_06_14 } from "../repositories/EventTypesRepository_2024_06_14";

/**
 * EventTypesService_2024_06_14
 *
 * Business logic for event type operations (2024-06-14 API version)
 */
@Injectable()
export class EventTypesService_2024_06_14 {
  private repository: EventTypesRepository_2024_06_14;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new EventTypesRepository_2024_06_14(prisma);
  }

  async getUserEventType(userId: number, eventTypeId: number) {
    return await this.repository.getUserEventType(userId, eventTypeId);
  }

  async getEventTypeById(eventTypeId: number) {
    return await this.repository.getEventTypeById(eventTypeId);
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
    return await this.repository.createEventType(data);
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
    return await this.repository.updateEventType(eventTypeId, data);
  }

  async deleteEventType(eventTypeId: number) {
    return await this.repository.deleteEventType(eventTypeId);
  }
}
