export { verifyCodeUnAuthenticated } from "@calcom/features/auth/lib/verifyCodeUnAuthenticated";
export { sendEmailVerificationByCode } from "@calcom/features/auth/lib/verifyEmail";
export type {
  BookingAttendee,
  BookingHost,
  BookingOutput_2024_08_13,
  EventType,
} from "@calcom/features/bookings/outputs/BookingOutput_2024_08_13";
export type { CreateBookingOutput_2024_08_13 } from "@calcom/features/bookings/outputs/CreateBookingOutput_2024_08_13";
export type { CreateRecurringSeatedBookingOutput_2024_08_13 } from "@calcom/features/bookings/outputs/CreateRecurringSeatedBookingOutput_2024_08_13";
export type {
  CreateSeatedBookingOutput_2024_08_13,
  SeatedAttendee,
} from "@calcom/features/bookings/outputs/CreateSeatedBookingOutput_2024_08_13";
export type { RecurringBookingOutput_2024_08_13 } from "@calcom/features/bookings/outputs/RecurringBookingOutput_2024_08_13";
export { BookingAccessService } from "@calcom/features/bookings/services/BookingAccessService";
export type { BookingResponse } from "@calcom/features/bookings/types";
export { CALENDARS_QUEUE, DEFAULT_CALENDARS_JOB } from "@calcom/features/calendars/lib/constants";
export type { Calendar, ConnectedCalendar } from "@calcom/features/calendars/outputs/ConnectedCalendar";
export { CalendarsRepository } from "@calcom/features/calendars/repositories/CalendarsRepository";
export { CalendarsCacheService } from "@calcom/features/calendars/services/CalendarsCacheService";
export { CalendarsService } from "@calcom/features/calendars/services/CalendarsService";
export { cityTimezonesHandler } from "@calcom/features/cityTimezones/cityTimezonesHandler";
export { DEFAULT_EVENT_TYPES } from "@calcom/features/event-types/constants/constants";
export { EventTypesModule_2024_06_14 } from "@calcom/features/event-types/EventTypesModule_2024_06_14";
export type { CreatePhoneCallInput } from "@calcom/features/event-types/inputs/CreatePhoneCallInput";
export type { CreatePhoneCallOutput } from "@calcom/features/event-types/outputs/CreatePhoneCallOutput";
export { EventTypesRepository_2024_04_15 } from "@calcom/features/event-types/repositories/EventTypesRepository_2024_04_15";
export { EventTypesRepository_2024_06_14 } from "@calcom/features/event-types/repositories/EventTypesRepository_2024_06_14";
export { EventTypesService_2024_06_14 } from "@calcom/features/event-types/services/EventTypesService_2024_06_14";
export { getRoutedUrl } from "@calcom/features/routing-forms/lib/getRoutedUrl";
export type { CreateScheduleInput_2024_04_15 } from "@calcom/features/schedules/inputs/CreateScheduleInput_2024_04_15";
export { SchedulesRepository } from "@calcom/features/schedules/repositories/SchedulesRepository";
export { SchedulesModule_2024_06_11 } from "@calcom/features/schedules/SchedulesModule_2024_06_11";
export { SchedulesService_2024_04_15 } from "@calcom/features/schedules/services/SchedulesService_2024_04_15";
export { SchedulesService_2024_06_11 } from "@calcom/features/schedules/services/SchedulesService_2024_06_11";
export { MINUTES_TO_BOOK } from "@calcom/lib/constants";
export { getTranslation } from "@calcom/lib/server/i18n";
export { encryptServiceAccountKey } from "@calcom/lib/server/serviceAccountKey";
export { slugify } from "@calcom/lib/slugify";
export { slugifyLenient } from "@calcom/lib/slugify-lenient";
export { AttributeType, CreationSource, MembershipRole, SchedulingType } from "@calcom/prisma/enums";
export { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";
export { paymentDataSelect } from "@calcom/prisma/selects/payment";
export { teamMetadataSchema, userMetadata } from "@calcom/prisma/zod-utils";
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
export { dynamicEvent } from "@calcom/features/eventtypes/lib/defaultEvents";
export { handleCreatePhoneCall } from "@calcom/features/handleCreatePhoneCall";
export { OAuthService } from "@calcom/features/oauth/services/OAuthService";
export { generateSecret } from "@calcom/features/oauth/utils/generateSecret";
export { ProfileRepository } from "@calcom/features/profile/repositories/ProfileRepository";
export { findTeamMembersMatchingAttributeLogic } from "@calcom/features/routing-forms/lib/findTeamMembersMatchingAttributeLogic";
export type { Tasker } from "@calcom/features/tasker/tasker";
export { getTasker } from "@calcom/features/tasker/tasker-factory";
export { AnalyticsRepository } from "@calcom/features/thotis/repositories/AnalyticsRepository";
export { ProfileRepository as ThotisProfileRepository } from "@calcom/features/thotis/repositories/ProfileRepository";
export { SessionRatingRepository } from "@calcom/features/thotis/repositories/SessionRatingRepository";
export {
  type CreateProfileInput,
  ProfileService,
  type UpdateProfileInput,
} from "@calcom/features/thotis/services/ProfileService";
export { SessionRatingService } from "@calcom/features/thotis/services/SessionRatingService";
export { StatisticsService } from "@calcom/features/thotis/services/StatisticsService";
export { ThotisAnalyticsService } from "@calcom/features/thotis/services/ThotisAnalyticsService";
export { ThotisBookingService } from "@calcom/features/thotis/services/ThotisBookingService";
export { verifyCodeChallenge } from "@calcom/lib/pkce";
export { validateUrlForSSRFSync } from "@calcom/lib/ssrfProtection";
export { checkEmailVerificationRequired } from "@calcom/trpc/server/routers/publicViewer/checkIfUserEmailVerificationRequired.handler";
export type { TFindTeamMembersMatchingAttributeLogicInputSchema } from "@calcom/trpc/server/routers/viewer/attributes/findTeamMembersMatchingAttributeLogic.schema";
export {
  type GroupedAttribute,
  groupMembershipAttributes,
} from "@calcom/trpc/server/routers/viewer/attributes/getByUserId.handler";
export type { OrgMembershipLookup } from "@calcom/trpc/server/routers/viewer/slots/util";
export { TRPCError } from "@trpc/server";

// OSS Stubs
export const createNewUsersConnectToOrgIfExists = async (...args: any[]): Promise<any[]> => [];
export const checkAdminOrOwner = async (...args: any[]): Promise<boolean> => false;
export const getClientSecretFromPayment = async (...args: any[]): Promise<string> => "";
export const updateNewTeamMemberEventTypes = async (...args: any[]): Promise<void> => {};
export {
  TimeUnit,
  WebhookTriggerEvents,
  WorkflowActions,
  WorkflowTemplates,
  WorkflowTriggerEvents,
} from "@calcom/prisma/enums";
export const WebhookVersion = { V1: "V1", V2: "V2", V_2021_10_20: "V_2021_10_20" } as const;
export type WebhookVersion = (typeof WebhookVersion)[keyof typeof WebhookVersion];
export const getTeamMemberEmailForResponseOrContactUsingUrlQuery = async (...args: any[]): Promise<string> =>
  "";
export type TeamQuery = any;
export const verifyCodeAuthenticated = async (..._args: unknown[]): Promise<boolean> => true;
export const createApiKeyHandler = async (...args: any[]): Promise<string> => "";
export type CityTimezones = any;
export const sendVerificationCode = async (...args: any[]): Promise<any> => ({});
export const verifyPhoneNumber = async (...args: any[]): Promise<any> => ({});
export const sendSignupToOrganizationEmail = async (..._args: unknown[]) => ({ ok: true });
export const verifyEmailCodeHandler = async (..._args: unknown[]) => true;
