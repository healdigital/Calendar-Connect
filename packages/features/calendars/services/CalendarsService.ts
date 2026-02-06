import {
  getCalendarCredentials,
  getConnectedCalendars,
} from "@calcom/features/calendars/lib/CalendarManager";
import type { CredentialForCalendarService } from "@calcom/types/Credential";
import type { Calendar, ConnectedCalendar } from "../outputs/ConnectedCalendar";
import type { CalendarsRepository } from "../repositories/CalendarsRepository";
import type { CalendarsCacheService } from "./CalendarsCacheService";

export class CalendarsService {
  constructor(
    private readonly calendarsRepository: CalendarsRepository,
    private readonly calendarsCacheService: CalendarsCacheService
  ) {}

  async getCalendars(userId: number) {
    // Check cache first
    const cached = await this.calendarsCacheService.getConnectedCalendarsCache(userId);
    if (cached) {
      return {
        connectedCalendars: cached.connectedCalendars,
        destinationCalendar: undefined,
      };
    }

    // Get selected calendars and credentials from database
    const selectedCalendars = await this.calendarsRepository.getSelectedCalendarsByUserId(userId);
    const credentials = await this.calendarsRepository.getCredentialsByUserId(userId);

    // Get calendar credentials
    const calendarCredentials = getCalendarCredentials(credentials as CredentialForCalendarService[]);

    // Get connected calendars
    const { connectedCalendars, destinationCalendar } = await getConnectedCalendars(
      calendarCredentials,
      selectedCalendars
    );

    // Cache the result
    await this.calendarsCacheService.setConnectedCalendarsCache(userId, {
      connectedCalendars: connectedCalendars as ConnectedCalendar[],
    });

    return {
      connectedCalendars: connectedCalendars as ConnectedCalendar[],
      destinationCalendar,
    };
  }

  async getConnectedCalendars(userId: number): Promise<ConnectedCalendar[]> {
    const result = await this.getCalendars(userId);
    return result.connectedCalendars;
  }

  async getCalendarsByUserId(userId: number): Promise<Calendar[]> {
    const { connectedCalendars } = await this.getCalendars(userId);
    return connectedCalendars.flatMap((cal) => cal.calendars ?? []);
  }
}
