import { BadRequestException, Injectable } from "@nestjs/common";
import {
  SelectedCalendarsInputDto,
  SelectedCalendarsQueryParamsInputDto,
} from "@/modules/selected-calendars/inputs/selected-calendars.input";
import { UserWithProfile } from "@/modules/users/users.repository";

@Injectable()
export class SelectedCalendarsService {
  async addSelectedCalendar(_user: UserWithProfile, _input: SelectedCalendarsInputDto) {
    throw new BadRequestException("Selected calendars management is not available in this build.");
  }

  async deleteSelectedCalendar(
    _selectedCalendar: SelectedCalendarsQueryParamsInputDto,
    _user: UserWithProfile
  ) {
    throw new BadRequestException("Selected calendars management is not available in this build.");
  }
}
