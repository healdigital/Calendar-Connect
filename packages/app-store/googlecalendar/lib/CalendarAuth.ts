import {
  //   CalendarAppDelegationCredentialClientIdNotAuthorizedError,
  //   CalendarAppDelegationCredentialError,
  //   CalendarAppDelegationCredentialInvalidGrantError,
} from "@calcom/lib/CalendarAppError";
import {
  APP_CREDENTIAL_SHARING_ENABLED,
  CREDENTIAL_SYNC_ENDPOINT,
  CREDENTIAL_SYNC_SECRET,
  CREDENTIAL_SYNC_SECRET_HEADER_NAME,
} from "@calcom/lib/constants";
import logger from "@calcom/lib/logger";
import type { Prisma } from "@calcom/prisma/client";
import type { CredentialForCalendarServiceWithEmail } from "@calcom/types/Credential";
import { calendar_v3 } from "@googleapis/calendar";
import { JWT, OAuth2Client } from "googleapis-common";
import { invalidateCredential } from "../../_utils/invalidateCredential";
import { OAuthManager } from "../../_utils/oauth/OAuthManager";
import { oAuthManagerHelper } from "../../_utils/oauth/oAuthManagerHelper";
import { OAuth2UniversalSchema } from "../../_utils/oauth/universalSchema";
import { metadata } from "../_metadata";
import { getGoogleAppKeys } from "./getGoogleAppKeys";

// type DelegatedTo = NonNullable<CredentialForCalendarServiceWithEmail["delegatedTo"]>;
const log = logger.getSubLogger({ prefix: ["app-store/googlecalendar/lib/CalendarAuth"] });

class MyGoogleOAuth2Client extends OAuth2Client {
  constructor(client_id: string, client_secret: string, redirect_uri: string) {
    super({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirect_uri,
      // default: 5 * 60 * 1000, 5 minutes
      // tho, fn will never run in excess of 60 seconds
      eagerRefreshThresholdMillis: 60000,
    });
  }

  isTokenExpiring() {
    return super.isTokenExpiring();
  }

  async refreshToken(token: string | null | undefined) {
    return super.refreshToken(token);
  }
}

export class CalendarAuth {
  private credential: CredentialForCalendarServiceWithEmail;

  private oAuthClient: MyGoogleOAuth2Client | null = null;
  public authManager!: OAuthManager;
  private authMechanism: ReturnType<CalendarAuth["initAuthMechanism"]>;

  constructor(credential: CredentialForCalendarServiceWithEmail) {
    this.credential = credential;
    this.authMechanism = this.initAuthMechanism(credential);
  }

  private async getOAuthClientSingleton() {
    if (this.oAuthClient) {
      log.debug("Reusing existing oAuthClient");
      return this.oAuthClient;
    }
    log.debug("Creating new oAuthClient");
    const { client_id, client_secret, redirect_uris } = await getGoogleAppKeys();
    const googleCredentials = OAuth2UniversalSchema.parse(this.credential.key);
    this.oAuthClient = new MyGoogleOAuth2Client(client_id, client_secret, redirect_uris[0]);
    this.oAuthClient.setCredentials(googleCredentials);
    return this.oAuthClient;
  }

  private async refreshOAuthToken({ refreshToken }: { refreshToken: string | null }) {
    const oAuthClient = await this.getOAuthClientSingleton();
    return oAuthClient.refreshToken(refreshToken);
  }

  private initAuthMechanism(credential: CredentialForCalendarServiceWithEmail) {
    const authManager = new OAuthManager({
      // Keep it false for oauth because Google's OAuth2Client library supports token expiry check
      autoCheckTokenExpiryOnRequest: false,
      isTokenExpiring: async () => {
        const oAuthClient = await this.getOAuthClientSingleton();
        return oAuthClient.isTokenExpiring();
      },
      credentialSyncVariables: {
        APP_CREDENTIAL_SHARING_ENABLED: APP_CREDENTIAL_SHARING_ENABLED,
        CREDENTIAL_SYNC_ENDPOINT: CREDENTIAL_SYNC_ENDPOINT,
        CREDENTIAL_SYNC_SECRET: CREDENTIAL_SYNC_SECRET,
        CREDENTIAL_SYNC_SECRET_HEADER_NAME: CREDENTIAL_SYNC_SECRET_HEADER_NAME,
      },
      resourceOwner: {
        type: "user",
        id: credential.userId,
      },
      appSlug: metadata.slug,
      getCurrentTokenObject: async () => {
        return oAuthManagerHelper.getCurrentTokenObject(this.credential);
      },
      fetchNewTokenObject: async ({ refreshToken }: { refreshToken: string | null }) => {
        log.debug("Fetching new token object for my Google Auth");
        const tokenFetchedResult = await this.refreshOAuthToken({ refreshToken });
        const result = {
          tokenObject: tokenFetchedResult.res?.data ?? null,
          status: tokenFetchedResult.res?.status,
          statusText: tokenFetchedResult.res?.statusText,
        };
        return new Response(JSON.stringify(result.tokenObject), {
          status: result.status,
          statusText: result.statusText,
        });
      },
      isTokenObjectUnusable: async (response) => {
        if (!response.ok || (response.status < 200 && response.status >= 300)) {
          const responseBody = await response.json();
          if (responseBody.error === "invalid_grant") {
            return {
              reason: "invalid_grant",
            };
          }
        }
        return null;
      },
      isAccessTokenUnusable: async () => {
        return null;
      },
      invalidateTokenObject: () => invalidateCredential(this.credential.id),
      expireAccessToken: async () => {
        await oAuthManagerHelper.markTokenAsExpired(this.credential);
      },
      updateTokenObject: async (token) => {
        await oAuthManagerHelper.updateTokenObjectInDb({
          tokenObject: token,
          authStrategy: "oauth",
          credentialId: this.credential.id,
        });
        if (this.oAuthClient) {
          this.oAuthClient.setCredentials(token);
        }

        // Update cached credential as well
        this.credential.key = token as Prisma.JsonValue;
      },
    });
    this.authManager = authManager;

    return {
      getOAuthClientWithRefreshedToken: async () => {
        const { token } = await authManager.getTokenObjectOrFetch();
        if (!token) {
          throw new Error("Invalid grant for Google Calendar app");
        }
        const oAuthClient = await this.getOAuthClientSingleton();
        return oAuthClient;
      },
    };
  }

  /**
   * Returns a Google Calendar client that is authenticated with the user's credentials.
   */
  public async getClient(): Promise<calendar_v3.Calendar> {
    log.debug("Getting authed calendar client");
    const googleAuthClient = await this.authMechanism.getOAuthClientWithRefreshedToken();

    if (!googleAuthClient) {
      throw new Error("Failed to initialize Google Auth client");
    }

    return new calendar_v3.Calendar({
      auth: googleAuthClient,
    });
  }
}
