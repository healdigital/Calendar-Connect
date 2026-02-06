// import { getStripeCustomerIdFromUserId } from "@calcom/app-store/stripepayment/lib/customer";
import stripe from "@calcom/app-store/stripepayment/lib/server";
import { getPhoneNumberMonthlyPriceId } from "@calcom/app-store/stripepayment/lib/utils";
import { IS_PRODUCTION, WEBAPP_URL } from "@calcom/lib/constants";
import { HttpError } from "@calcom/lib/http-error";
import logger from "@calcom/lib/logger";
import type { TrackingData } from "@calcom/lib/tracking";
import { PhoneNumberSubscriptionStatus } from "@calcom/prisma/enums";
import { z } from "zod";
import type { PhoneNumberRepositoryInterface } from "../../interfaces/PhoneNumberRepositoryInterface";
import type { RetellAIRepository } from "../types";

const CHECKOUT_SESSION_TYPES = {
  PHONE_NUMBER_SUBSCRIPTION: "PHONE_NUMBER_SUBSCRIPTION",
};

const stripeErrorSchema = z.object({
  raw: z.object({
    code: z.string(),
  }),
});

export class BillingService {
  private logger = logger.getSubLogger({ prefix: ["BillingService"] });
  constructor(
    private deps: {
      phoneNumberRepository: PhoneNumberRepositoryInterface;
      retellRepository: RetellAIRepository;
    }
  ) {}

  async generatePhoneNumberCheckoutSession({
    userId,
    teamId,
    agentId,
    workflowId,
    tracking,
  }: {
    userId: number;
    teamId?: number;
    agentId?: string | null;
    workflowId?: string;
    tracking?: TrackingData;
  }): Promise<{ url: string; message: string }> {
    this.logger.warn("generatePhoneNumberCheckoutSession called but Stripe integration is disabled in OS.");
    throw new HttpError({
      statusCode: 501,
      message: "Phone number subscription is not supported in this version.",
    });
  }

  async cancelPhoneNumberSubscription({
    phoneNumberId,
    userId,
    teamId,
  }: {
    phoneNumberId: number;
    userId: number;
    teamId?: number;
  }): Promise<{ success: boolean; message: string }> {
    this.logger.warn("cancelPhoneNumberSubscription called but Stripe integration is disabled in OS.");
    // We can still try to delete the phone number from Retell/DB if needed, but subscription part is skipped

    // Find phone number with proper team authorization
    const phoneNumber = teamId
      ? await this.deps.phoneNumberRepository.findByIdWithTeamAccess({
          id: phoneNumberId,
          teamId,
          userId,
        })
      : await this.deps.phoneNumberRepository.findByIdAndUserId({
          id: phoneNumberId,
          userId,
        });

    if (!phoneNumber) {
      throw new HttpError({
        statusCode: 404,
        message: "Phone number not found or you don't have permission to cancel it.",
      });
    }

    // Logic to just release the number without stripe
    try {
      await this.deps.phoneNumberRepository.updateSubscriptionStatus({
        id: phoneNumberId,
        subscriptionStatus: PhoneNumberSubscriptionStatus.CANCELLED,
        disconnectAgents: true,
      });

      // Delete the phone number from Retell, DB
      try {
        await this.deps.retellRepository.deletePhoneNumber(phoneNumber.phoneNumber);
      } catch (error) {
        this.logger.error("Failed to delete phone number from AI service:", {
          error,
        });
      }

      return { success: true, message: "Phone number released successfully." };
    } catch (error) {
      this.logger.error("Error releasing phone number:", { error });
      throw new HttpError({
        statusCode: 500,
        message: "Failed to release number.",
      });
    }
  }
}
