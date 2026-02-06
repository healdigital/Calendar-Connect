import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdateUnifiedCalendarEventInput } from "../inputs/update-unified-calendar-event.input";
import { GetUnifiedCalendarEventOutput } from "../outputs/get-unified-calendar-event.output";

@Injectable()
export class GoogleCalendarService {
  async getEventDetails(_eventUid: string): Promise<any> {
    throw new BadRequestException("Meeting details are not available in this build.");
  }

  async updateEventDetails(_eventUid: string, _updateData: UpdateUnifiedCalendarEventInput): Promise<any> {
    throw new BadRequestException("Event updates are not available in this build.");
  }
}
