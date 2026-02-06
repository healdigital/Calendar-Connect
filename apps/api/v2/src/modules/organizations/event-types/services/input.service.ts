import { slugifyLenient } from "@calcom/platform-libraries";
import { EventTypeMetadata } from "@calcom/platform-libraries/event-types";
import {
  CreateTeamEventTypeInput_2024_06_14,
  EmailSettings_2024_06_14,
  HostPriority,
  UpdateTeamEventTypeInput_2024_06_14,
} from "@calcom/platform-types";
import type { EventType } from "@calcom/prisma/client";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConferencingRepository } from "@/modules/conferencing/repositories/conferencing.repository";
import { OrganizationsConferencingService } from "@/modules/organizations/conferencing/services/organizations-conferencing.service";
import { TeamsEventTypesRepository } from "@/modules/teams/event-types/teams-event-types.repository";
import { TeamsRepository } from "@/modules/teams/teams/teams.repository";
import { UsersRepository } from "@/modules/users/users.repository";

export const HOSTS_REQUIRED_WHEN_SWITCHING_SCHEDULING_TYPE_ERROR =
  "Hosts required when switching schedulingType. Please provide 'hosts' or set 'assignAllTeamMembers: true' to specify how hosts should be configured for the new scheduling type.";

export type TransformedCreateTeamEventTypeInput = Awaited<
  ReturnType<InstanceType<typeof InputOrganizationsEventTypesService>["transformInputCreateTeamEventType"]>
>;

export type TransformedUpdateTeamEventTypeInput = Awaited<
  ReturnType<InstanceType<typeof InputOrganizationsEventTypesService>["transformInputUpdateTeamEventType"]>
>;

@Injectable()
export class InputOrganizationsEventTypesService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly teamsEventTypesRepository: TeamsEventTypesRepository,
    private readonly conferencingService: OrganizationsConferencingService,
    private readonly conferencingRepository: ConferencingRepository
  ) {}

  async transformAndValidateCreateTeamEventTypeInput(
    userId: number,
    teamId: number,
    inputEventType: CreateTeamEventTypeInput_2024_06_14
  ) {
    throw new Error("Not implemented in OSS");
    return {} as any;
  }

  async transformAndValidateUpdateTeamEventTypeInput(
    userId: number,
    eventTypeId: number,
    teamId: number,
    inputEventType: UpdateTeamEventTypeInput_2024_06_14
  ) {
    throw new Error("Not implemented in OSS");
    return {} as any;
  }

  async validateTeamEventTypeSlug(teamId: number, slug: string) {
    const teamEventWithSlugExists = await this.teamsEventTypesRepository.getEventTypeByTeamIdAndSlug(
      teamId,
      slug
    );

    if (teamEventWithSlugExists) {
      throw new BadRequestException("Team event type with this slug already exists");
    }
  }

  async transformInputCreateTeamEventType(
    teamId: number,
    inputEventType: CreateTeamEventTypeInput_2024_06_14
  ) {
    return {} as any;
  }

  async transformInputUpdateTeamEventType(
    eventTypeId: number,
    teamId: number,
    inputEventType: UpdateTeamEventTypeInput_2024_06_14
  ) {
    return {} as any;
  }

  // Helper methods stubbed or kept if generic
  // Keeping helper methods that don't depend on EE services to avoid breaking internal calls if any
  // But strictly speaking, the main entry points are disabled, so these won't be called.

  async getChildEventTypesForManagedEventTypeUpdate(
    eventTypeId: number,
    inputEventType: UpdateTeamEventTypeInput_2024_06_14,
    teamId: number
  ) {
    return undefined;
  }

  async getOwnersIdsForManagedEventTypeUpdate(
    teamId: number,
    inputEventType: UpdateTeamEventTypeInput_2024_06_14,
    eventType: { children: { userId: number | null }[] }
  ) {
    return [];
  }

  async getChildEventTypesForManagedEventTypeCreate(
    inputEventType: Pick<CreateTeamEventTypeInput_2024_06_14, "assignAllTeamMembers" | "hosts">,
    teamId: number
  ) {
    return [];
  }

  async getOwnersIdsForManagedEventTypeCreate(
    teamId: number,
    inputEventType: Pick<CreateTeamEventTypeInput_2024_06_14, "assignAllTeamMembers" | "hosts">
  ) {
    return [];
  }

  async getTeamUsersIds(teamId: number) {
    const team = await this.teamsRepository.getById(teamId);
    if (!team) return [];
    const isPlatformTeam = !!team?.createdByOAuthClientId;
    if (isPlatformTeam) {
      return await this.teamsRepository.getTeamManagedUsersIds(teamId);
    }
    return await this.teamsRepository.getTeamUsersIds(teamId);
  }

  transformInputTeamLocations(inputLocations: CreateTeamEventTypeInput_2024_06_14["locations"]) {
    // This was using EE transformer.
    return [];
  }

  async getOwnersForManagedEventType(userIds: number[]) {
    return [];
  }

  async getAllTeamMembers(teamId: number, schedulingType: any) {
    return [];
  }

  transformInputHosts(
    inputHosts: CreateTeamEventTypeInput_2024_06_14["hosts"] | undefined,
    schedulingType: any
  ) {
    return undefined;
  }

  async validateHosts(teamId: number, hosts: CreateTeamEventTypeInput_2024_06_14["hosts"] | undefined) {
    // no-op
  }

  async validateInputLocations(
    teamId: number,
    inputLocations?: CreateTeamEventTypeInput_2024_06_14["locations"]
  ) {
    // no-op
  }
}
