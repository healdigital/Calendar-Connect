import { GetBookingsInput_2024_08_13 } from "@calcom/platform-types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "@/modules/users/users.repository";

@Injectable()
export class OrganizationUsersBookingsService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getOrganizationUserBookings(orgId: number, userId: number, queryParams: GetBookingsInput_2024_08_13) {
    throw new Error("Not implemented in OSS");
    return {} as any;
  }
}
