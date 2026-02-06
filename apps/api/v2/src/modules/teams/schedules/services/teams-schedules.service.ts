import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class TeamsSchedulesService {
  async getTeamSchedules(_teamId: number, _skip = 0, _take = 250, _eventTypeId?: number): Promise<any[]> {
    throw new BadRequestException("Team schedules management is not available in this build.");
  }
}
