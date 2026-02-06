import { Injectable } from "@nestjs/common";
import { UsersRepository } from "@/modules/users/users.repository";

@Injectable()
export class OrganizationsSchedulesService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getOrganizationSchedules(organizationId: number, skip = 0, take = 250) {
    return { schedules: [], cursor: null };
  }
}
