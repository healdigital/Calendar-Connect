import {
  CalendarAppDelegationCredentialConfigurationError,
  CalendarAppDelegationCredentialInvalidGrantError,
} from "@calcom/lib/CalendarAppError";
import { HttpError } from "@calcom/lib/http-error";
import logger from "@calcom/lib/logger";
import type { CalendarEvent } from "@calcom/types/Calendar";
import type { CredentialForCalendarServiceWithTenantId } from "@calcom/types/Credential";
import type { PartialReference } from "@calcom/types/EventManager";
import type { VideoApiAdapter, VideoCallData } from "@calcom/types/VideoApiAdapter";
import { z } from "zod";
import getParsedAppKeysFromSlug from "../../_utils/getParsedAppKeysFromSlug";
import { OAuthManager } from "../../_utils/oauth/OAuthManager";
import { oAuthManagerHelper } from "../../_utils/oauth/oAuthManagerHelper";
import { OFFICE365_VIDEO_SCOPES } from "../api/add";
import config from "../config.json";

/** @link https://docs.microsoft.com/en-us/graph/api/application-post-onlinemeetings?view=graph-rest-1.0&tabs=http#response */
export interface TeamsEventResult {
  creationDateTime: string;
  startDateTime: string;
  endDateTime: string;
  id: string;
  joinWebUrl: string;
  subject: string;
}

const o365VideoAppKeysSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
});

const getO365VideoAppKeys = async () => {
  return getParsedAppKeysFromSlug(config.slug, o365VideoAppKeysSchema);
};

const TeamsVideoApiAdapter = (credential: CredentialForCalendarServiceWithTenantId): VideoApiAdapter => {
  const log = logger.getSubLogger({ prefix: ["TeamsVideoApiAdapter"] });
  const azureUserId: string | null = null;
  const tokenResponse = oAuthManagerHelper.getTokenObjectFromCredential(credential);

  const auth = new OAuthManager({
    credentialSyncVariables: oAuthManagerHelper.credentialSyncVariables,
    resourceOwner: {
      type: "user",
      id: credential.userId,
    },
    appSlug: config.slug,
    currentTokenObject: tokenResponse,
    fetchNewTokenObject: async ({ refreshToken }: { refreshToken: string | null }) => {
      if (!refreshToken) {
        return null;
      }

      const credentials = await getO365VideoAppKeys();

      const url = await getAuthUrl();
      const params: Record<string, string> = {
        scope: OFFICE365_VIDEO_SCOPES.join(" "),
        client_id: credentials.client_id || "",
        client_secret: credentials.client_secret || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken ?? "",
      };

      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params),
      });
    },
    isTokenObjectUnusable: async () => {
      // TODO: Implement this. As current implementation of CalendarService doesn't handle it. It hasn't been handled in the OAuthManager implementation as well.
      // This is a placeholder for future implementation.
      return null;
    },
    isAccessTokenUnusable: async () => {
      // TODO: Implement this
      return null;
    },
    invalidateTokenObject: () => oAuthManagerHelper.invalidateCredential(credential.id),
    expireAccessToken: () => oAuthManagerHelper.markTokenAsExpired(credential),
    updateTokenObject: (tokenObject) => {
      return oAuthManagerHelper.updateTokenObject({ tokenObject, credentialId: credential.id });
    },
  });

  async function getAuthUrl(): Promise<string> {
    return "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  }

  const translateEvent = (event: CalendarEvent) => {
    return {
      startDateTime: event.startTime,
      endDateTime: event.endTime,
      subject: event.title,
    };
  };

  async function getAzureUserId(credential: CredentialForCalendarServiceWithTenantId) {
    if (azureUserId) return azureUserId;

    return null;
  }

  async function getUserEndpoint(): Promise<string> {
    const azureUserId = await getAzureUserId(credential);
    return azureUserId
      ? `https://graph.microsoft.com/v1.0/users/${azureUserId}`
      : "https://graph.microsoft.com/v1.0/me";
  }

  // Since the meeting link is not tied to an event we only need the create and update functions
  return {
    getAvailability: () => {
      return Promise.resolve([]);
    },
    updateMeeting: async (bookingRef: PartialReference, event: CalendarEvent) => {
      try {
        const response = await auth.requestRaw({
          url: `${await getUserEndpoint()}/onlineMeetings`,
          options: {
            method: "POST",
            body: JSON.stringify(translateEvent(event)),
          },
        });

        if (!response.ok) {
          throw new HttpError({
            statusCode: response.status,
            message: response.statusText,
          });
        }

        const resultString = await response.text();
        const resultObject = JSON.parse(resultString);

        return Promise.resolve({
          type: "office365_video",
          id: resultObject.id,
          password: "",
          url: resultObject.joinWebUrl || resultObject.joinUrl,
        });
      } catch (error) {
        log.error(`Error updating MS Teams meeting for booking ${event.uid}`, error);
        if (error instanceof HttpError) {
          throw error;
        }
        throw new HttpError({
          statusCode: 500,
          message: `Error updating MS Teams meeting for booking ${event.uid}`,
        });
      }
    },
    deleteMeeting: () => {
      return Promise.resolve([]);
    },
    createMeeting: async (event: CalendarEvent): Promise<VideoCallData> => {
      const url = `${await getUserEndpoint()}/onlineMeetings`;
      try {
        const response = await auth.requestRaw({
          url,
          options: {
            method: "POST",
            body: JSON.stringify(translateEvent(event)),
          },
        });

        if (!response.ok) {
          throw new HttpError({
            statusCode: response.status,
            message: response.statusText,
          });
        }

        const resultString = await response.text();

        const resultObject = JSON.parse(resultString);

        if (!resultObject.id || !resultObject.joinUrl || !resultObject.joinWebUrl) {
          throw new HttpError({
            statusCode: 500,
            message: `Error creating MS Teams meeting: ${resultObject.error?.message || "missing required fields in response"}`,
          });
        }

        log.debug("Teams meeting created", { meetingId: resultObject.id });

        return Promise.resolve({
          type: "office365_video",
          id: resultObject.id,
          password: "",
          url: resultObject.joinWebUrl || resultObject.joinUrl,
        });
      } catch (error) {
        log.error(`Error creating MS Teams meeting for booking ${event.uid}`, error);
        if (error instanceof HttpError) {
          throw error;
        }
        throw new HttpError({
          statusCode: 500,
          message: `Error creating MS Teams meeting for booking ${event.uid}`,
        });
      }
    },
  };
};

export default TeamsVideoApiAdapter;
