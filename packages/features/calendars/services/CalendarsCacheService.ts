import type { RedisService } from "@calcom/features/redis/RedisService";
import type { ConnectedCalendar } from "../outputs/ConnectedCalendar";

export class CalendarsCacheService {
  constructor(private readonly redisService: RedisService) {}

  async getConnectedCalendarsCache(userId: number): Promise<{
    connectedCalendars: ConnectedCalendar[];
  } | null> {
    try {
      return await this.redisService.get<{ connectedCalendars: ConnectedCalendar[] }>(
        `calendar:user:${userId}:connected`
      );
    } catch {
      return null;
    }
  }

  async setConnectedCalendarsCache(
    userId: number,
    data: { connectedCalendars: ConnectedCalendar[] }
  ): Promise<void> {
    try {
      await this.redisService.set(`calendar:user:${userId}:connected`, data, {
        ttl: 3600000, // 1 hour in milliseconds
      });
    } catch {
      // Silently fail if Redis is not available
    }
  }

  async deleteConnectedAndDestinationCalendarsCache(userId: number): Promise<void> {
    try {
      await this.redisService.del(`calendar:user:${userId}:connected`);
      await this.redisService.del(`calendar:user:${userId}:destination`);
    } catch {
      // Silently fail if Redis is not available
    }
  }
}
