import { SchedulingType } from "@calcom/platform-libraries";
import { EventTypeMetadata } from "@calcom/platform-libraries/event-types";
import type { HostPriority, TeamEventTypeResponseHost } from "@calcom/platform-types";
import type {
  CalVideoSettings,
  DestinationCalendar,
  EventType,
  Host,
  Schedule,
  Team,
  User,
} from "@calcom/prisma/client";
import { Injectable } from "@nestjs/common";
import { TeamsEventTypesRepository } from "@/modules/teams/event-types/teams-event-types.repository";
import { UsersRepository } from "@/modules/users/users.repository";

type EventTypeRelations = {
  users: User[];
  schedule: Schedule | null;
  hosts: Host[];
  destinationCalendar?: DestinationCalendar | null;
  team?: Pick<
    Team,
    "bannerUrl" | "name" | "logoUrl" | "slug" | "weekStart" | "brandColor" | "darkBrandColor" | "theme"
  > | null;
  calVideoSettings?: CalVideoSettings | null;
};
export type DatabaseTeamEventType = EventType & EventTypeRelations;

type Input = Pick<
  DatabaseTeamEventType,
  | "id"
  | "length"
  | "title"
  | "description"
  | "disableGuests"
  | "slotInterval"
  | "minimumBookingNotice"
  | "beforeEventBuffer"
  | "afterEventBuffer"
  | "slug"
  | "schedulingType"
  | "requiresConfirmation"
  | "price"
  | "currency"
  | "lockTimeZoneToggleOnBookingPage"
  | "seatsPerTimeSlot"
  | "forwardParamsSuccessRedirect"
  | "successRedirectUrl"
  | "seatsShowAvailabilityCount"
  | "isInstantEvent"
  | "locations"
  | "bookingFields"
  | "recurringEvent"
  | "metadata"
  | "users"
  | "scheduleId"
  | "hosts"
  | "teamId"
  | "userId"
  | "parentId"
  | "assignAllTeamMembers"
  | "bookingLimits"
  | "durationLimits"
  | "onlyShowFirstAvailableSlot"
  | "offsetStart"
  | "periodType"
  | "periodDays"
  | "periodCountCalendarDays"
  | "periodStartDate"
  | "periodEndDate"
  | "requiresBookerEmailVerification"
  | "hideCalendarNotes"
  | "lockTimeZoneToggleOnBookingPage"
  | "eventTypeColor"
  | "seatsShowAttendees"
  | "requiresConfirmationWillBlockSlot"
  | "eventName"
  | "useEventTypeDestinationCalendarEmail"
  | "hideCalendarEventDetails"
  | "hideOrganizerEmail"
  | "team"
  | "calVideoSettings"
  | "hidden"
  | "bookingRequiresAuthentication"
  | "rescheduleWithSameRoundRobinHost"
  | "maxActiveBookingPerBookerOfferReschedule"
  | "maxActiveBookingsPerBooker"
  | "disableCancelling"
  | "disableRescheduling"
  | "minimumRescheduleNotice"
  | "canSendCalVideoTranscriptionEmails"
  | "interfaceLanguage"
  | "allowReschedulingPastBookings"
  | "allowReschedulingCancelledBookings"
  | "showOptimizedSlots"
  | "rrHostSubsetEnabled"
>;

@Injectable()
export class OutputOrganizationsEventTypesService {
  constructor(
    private readonly teamsEventTypesRepository: TeamsEventTypesRepository,
    private readonly usersRepository: UsersRepository
  ) {}

  async getResponseTeamEventType(databaseEventType: Input, isOrgTeamEvent: boolean) {
    throw new Error("Not implemented in OSS");
    return {} as any;
  }

  getResponseSchedulingType(schedulingType: SchedulingType) {
    if (schedulingType === SchedulingType.COLLECTIVE) {
      return "collective";
    }
    if (schedulingType === SchedulingType.ROUND_ROBIN) {
      return "roundRobin";
    }
    if (schedulingType === SchedulingType.MANAGED) {
      return "managed";
    }
    return schedulingType;
  }
}
