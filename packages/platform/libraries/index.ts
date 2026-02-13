export { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";
export { paymentDataSelect } from "@calcom/prisma/selects/payment";
export { getRoutedUrl } from "@calcom/features/routing-forms/lib/getRoutedUrl";
export { getTranslation } from "@calcom/lib/server/i18n";
export { slugify } from "@calcom/lib/slugify";
export { MembershipRole, AttributeType, SchedulingType, CreationSource } from "@calcom/prisma/enums";
export { userMetadata } from "@calcom/prisma/zod-utils";
export { teamMetadataSchema } from "@calcom/prisma/zod-utils";
export { MINUTES_TO_BOOK } from "@calcom/lib/constants";
export { cityTimezonesHandler } from "@calcom/features/cityTimezones/cityTimezonesHandler";
export { encryptServiceAccountKey } from "@calcom/lib/server/serviceAccountKey";
export { slugifyLenient } from "@calcom/lib/slugify-lenient";

export { verifyCodeUnAuthenticated } from "@calcom/features/auth/lib/verifyCodeUnAuthenticated";
export { sendEmailVerificationByCode } from "@calcom/features/auth/lib/verifyEmail";
export { BookingAccessService } from "@calcom/features/bookings/services/BookingAccessService";
export type {
  BookingOutput_2024_08_13,
  BookingHost,
  EventType,
  BookingAttendee,
} from "@calcom/features/bookings/outputs/BookingOutput_2024_08_13";
export type { RecurringBookingOutput_2024_08_13 } from "@calcom/features/bookings/outputs/RecurringBookingOutput_2024_08_13";
export type {
  CreateSeatedBookingOutput_2024_08_13,
  SeatedAttendee,
} from "@calcom/features/bookings/outputs/CreateSeatedBookingOutput_2024_08_13";
export type { CreateRecurringSeatedBookingOutput_2024_08_13 } from "@calcom/features/bookings/outputs/CreateRecurringSeatedBookingOutput_2024_08_13";
export type { CreateBookingOutput_2024_08_13 } from "@calcom/features/bookings/outputs/CreateBookingOutput_2024_08_13";
export type { BookingResponse } from "@calcom/features/bookings/types";
export type { Calendar, ConnectedCalendar } from "@calcom/features/calendars/outputs/ConnectedCalendar";
export { CALENDARS_QUEUE, DEFAULT_CALENDARS_JOB } from "@calcom/features/calendars/lib/constants";
export { CalendarsRepository } from "@calcom/features/calendars/repositories/CalendarsRepository";
export { CalendarsCacheService } from "@calcom/features/calendars/services/CalendarsCacheService";
export { CalendarsService } from "@calcom/features/calendars/services/CalendarsService";
export { DEFAULT_EVENT_TYPES } from "@calcom/features/event-types/constants/constants";
export { EventTypesModule_2024_06_14 } from "@calcom/features/event-types/EventTypesModule_2024_06_14";
export type { CreatePhoneCallInput } from "@calcom/features/event-types/inputs/CreatePhoneCallInput";
export type { CreatePhoneCallOutput } from "@calcom/features/event-types/outputs/CreatePhoneCallOutput";
export { EventTypesRepository_2024_04_15 } from "@calcom/features/event-types/repositories/EventTypesRepository_2024_04_15";
export { EventTypesRepository_2024_06_14 } from "@calcom/features/event-types/repositories/EventTypesRepository_2024_06_14";
export { EventTypesService_2024_06_14 } from "@calcom/features/event-types/services/EventTypesService_2024_06_14";
export type { CreateScheduleInput_2024_04_15 } from "@calcom/features/schedules/inputs/CreateScheduleInput_2024_04_15";
export { SchedulesRepository } from "@calcom/features/schedules/repositories/SchedulesRepository";
export { SchedulesModule_2024_06_11 } from "@calcom/features/schedules/SchedulesModule_2024_06_11";
export { SchedulesService_2024_04_15 } from "@calcom/features/schedules/services/SchedulesService_2024_04_15";
export { SchedulesService_2024_06_11 } from "@calcom/features/schedules/services/SchedulesService_2024_06_11";
export class StripeBillingService {
  constructor(...args: any[]) {
    throw new Error("EE service 'StripeBillingService' removed for AGPL compliance");
  }
}
export class TeamService {
  constructor(...args: any[]) {
    throw new Error("EE service 'TeamService' removed for AGPL compliance");
  }
  static async fetchTeamOrThrow() {
    throw new Error("EE service 'TeamService.fetchTeamOrThrow' removed for AGPL compliance");
  }
  static async removeMembers(..._args: unknown[]) {
    return;
  }
  static async createInvite(..._args: unknown[]) {
    return {};
  }
}
export class PermissionCheckService {
  constructor() {
    throw new Error("EE service 'PermissionCheckService' removed for AGPL compliance");
  }
  async checkPermission() {
    return false;
  }
}
export { OAuthService } from "@calcom/features/oauth/services/OAuthService";
export { generateSecret } from "@calcom/features/oauth/utils/generateSecret";
export { ProfileRepository } from "@calcom/features/profile/repositories/ProfileRepository";
export type { Tasker } from "@calcom/features/tasker/tasker";
export { getTasker } from "@calcom/features/tasker/tasker-factory";
export { AnalyticsRepository } from "@calcom/features/thotis/repositories/AnalyticsRepository";
export { ProfileRepository as ThotisProfileRepository } from "@calcom/features/thotis/repositories/ProfileRepository";
export { SessionRatingRepository } from "@calcom/features/thotis/repositories/SessionRatingRepository";
export { ProfileService, type CreateProfileInput, type UpdateProfileInput } from "@calcom/features/thotis/services/ProfileService";
export { SessionRatingService } from "@calcom/features/thotis/services/SessionRatingService";
export { StatisticsService } from "@calcom/features/thotis/services/StatisticsService";
export { ThotisAnalyticsService } from "@calcom/features/thotis/services/ThotisAnalyticsService";
export { ThotisBookingService } from "@calcom/features/thotis/services/ThotisBookingService";
export { handleCreatePhoneCall } from "@calcom/features/handleCreatePhoneCall";
export { dynamicEvent } from "@calcom/features/eventtypes/lib/defaultEvents";
export { findTeamMembersMatchingAttributeLogic } from "@calcom/features/routing-forms/lib/findTeamMembersMatchingAttributeLogic";
export { verifyCodeChallenge } from "@calcom/lib/pkce";
export { validateUrlForSSRFSync } from "@calcom/lib/ssrfProtection";
export { checkEmailVerificationRequired } from "@calcom/trpc/server/routers/publicViewer/checkIfUserEmailVerificationRequired.handler";
export type { OrgMembershipLookup } from "@calcom/trpc/server/routers/viewer/slots/util";
export {
  groupMembershipAttributes,
  type GroupedAttribute,
} from "@calcom/trpc/server/routers/viewer/attributes/getByUserId.handler";
export type { TFindTeamMembersMatchingAttributeLogicInputSchema } from "@calcom/trpc/server/routers/viewer/attributes/findTeamMembersMatchingAttributeLogic.schema";

export { TRPCError } from "@trpc/server";

// OSS Stubs
export const createNewUsersConnectToOrgIfExists = async (...args: any[]): Promise<any[]> => ([]);
export const checkAdminOrOwner = async (...args: any[]): Promise<boolean> => false;
export const getClientSecretFromPayment = async (...args: any[]): Promise<string> => "";
export const updateNewTeamMemberEventTypes = async (...args: any[]): Promise<void> => {};
export { WebhookTriggerEvents, WorkflowActions, WorkflowTemplates, TimeUnit, WorkflowTriggerEvents } from "@calcom/prisma/enums";
export const WebhookVersion = { V1: "V1", V2: "V2", V_2021_10_20: "V_2021_10_20" } as const;
export type WebhookVersion = (typeof WebhookVersion)[keyof typeof WebhookVersion];
export const getTeamMemberEmailForResponseOrContactUsingUrlQuery = async (...args: any[]): Promise<string> => "";
export type TeamQuery = any;
export const verifyCodeAuthenticated = async (..._args: unknown[]): Promise<boolean> => true;
export const createApiKeyHandler = async (...args: any[]): Promise<string> => "";
export type CityTimezones = any;
export const sendVerificationCode = async (...args: any[]): Promise<any> => ({});
export const verifyPhoneNumber = async (...args: any[]): Promise<any> => ({});
export const sendSignupToOrganizationEmail = async (..._args: unknown[]) => ({ ok: true });
export const verifyEmailCodeHandler = async (..._args: unknown[]) => true;
