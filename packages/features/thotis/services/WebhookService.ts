import { createHmac } from "node:crypto";
import process from "node:process";

export interface WebhookConfig {
  url: string;
  secret: string;
}

export type WebhookEventType =
  | "booking.created"
  | "booking.cancelled"
  | "booking.completed"
  | "booking.rescheduled";

export interface BaseWebhookPayload {
  event: WebhookEventType;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface BookingCreatedPayload {
  bookingId: number;
  studentProfileId: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  prospectiveStudent: {
    name: string;
    email: string;
    question?: string;
  };
}

export interface BookingCancelledPayload {
  bookingId: number;
  cancelledAt: string;
  reason: string;
  cancelledBy: "mentor" | "student";
}

export interface BookingCompletedPayload {
  bookingId: number;
  completedAt: string;
}

export interface BookingRescheduledPayload {
  bookingId: number;
  oldStartTime: string;
  newStartTime: string;
  newEndTime: string;
  rescheduledAt: string;
  googleMeetLink: string;
}

/**
 * Service for sending signed webhooks with retry logic for Thotis events
 * Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
export class WebhookService {
  private config: WebhookConfig;

  constructor(config?: WebhookConfig) {
    this.config = config || {
      url: process.env.THOTIS_WEBHOOK_URL || "",
      secret: process.env.THOTIS_WEBHOOK_SECRET || "",
    };
  }

  /**
   * Sending 'booking.created' webhook
   * Requirement 10.1
   */
  async sendBookingCreated(data: BookingCreatedPayload): Promise<void> {
    await this.sendWebhook("booking.created", data as unknown as Record<string, unknown>);
  }

  /**
   * Sending 'booking.cancelled' webhook
   * Requirement 10.2
   */
  async sendBookingCancelled(data: BookingCancelledPayload): Promise<void> {
    await this.sendWebhook("booking.cancelled", data as unknown as Record<string, unknown>);
  }

  /**
   * Sending 'booking.completed' webhook
   * Requirement 10.3
   */
  async sendBookingCompleted(data: BookingCompletedPayload): Promise<void> {
    await this.sendWebhook("booking.completed", data as unknown as Record<string, unknown>);
  }

  /**
   * Sending 'booking.rescheduled' webhook
   */
  async sendBookingRescheduled(data: BookingRescheduledPayload): Promise<void> {
    await this.sendWebhook("booking.rescheduled", data as unknown as Record<string, unknown>);
  }

  /**
   * Core webhook sending logic with signing and retries
   * Requirements 10.4 (Retry), 10.5 (Signing)
   */
  private async sendWebhook(event: WebhookEventType, payloadData: Record<string, unknown>): Promise<void> {
    if (!this.config.url) {
      console.warn("THOTIS_WEBHOOK_URL not configured, skipping webhook");
      return;
    }

    const payload: BaseWebhookPayload = {
      event,
      createdAt: new Date().toISOString(),
      payload: payloadData,
    };

    const signature = this.generateSignature(payload);
    const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

    await this.retryFailedWebhook(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const response = await fetch(this.config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Thotis-Signature": signature,
            "User-Agent": "Thotis-Webhook-Service/1.0",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }, backoffDelays);
  }

  /**
   * Generates HMAC-SHA256 signature
   * Requirement 10.5
   */
  public generateSignature(payload: BaseWebhookPayload): string {
    if (!this.config.secret) {
      return "no-secret-configured";
    }
    return createHmac("sha256", this.config.secret).update(JSON.stringify(payload)).digest("hex");
  }

  /**
   * Retries a function with exponential backoff
   * Requirement 10.4
   */
  public async retryFailedWebhook(fn: () => Promise<void>, delays: number[]): Promise<void> {
    let attempt = 0;

    // Initial attempt is attempt 0. If it fails, we try delays[0], then delays[1], etc.
    // Total attempts = 1 (initial) + delays.length

    try {
      await fn();
    } catch (error) {
      // If empty delays array, simply rethrow
      if (delays.length === 0) {
        console.error(`Webhook failed (attempt 1/1): ${error}`);
        throw error;
      }

      console.warn(
        `Webhook failed (attempt 1/${delays.length + 1}): ${error instanceof Error ? error.message : String(error)}. Retrying in ${delays[0]}ms...`
      );

      // Start retry loop
      for (const delay of delays) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, delay));
        try {
          await fn();
          return; // Success
        } catch (retryError) {
          console.warn(
            `Webhook failed (attempt ${attempt + 1}/${delays.length + 1}): ${retryError instanceof Error ? retryError.message : String(retryError)}.`
          );
          // Continue to next delay if available
        }
      }

      // All retries failed
      console.error("All webhook retry attempts failed.");
      // We log but maybe we don't transform this into a hard throw for the calling service to avoid disrupting the main flow?
      // Requirement says "The Cal_System SHALL retry...", it doesn't explicitly say it should crash the request.
      // However, for testing purposes, throwing might be better to detect failure.
      // Let's safe-fail here to not break the booking flow, but log error.
      // Actually, let's allow it to be caught if needed, but in production this likely runs async "fire and forget" or background job.
      // Given I'm calling this directly from the service flow (per current plan), I should probably NOT throw to avoid rolling back the transaction?
      // But wait, my plan has `await` in the service methods.
      // If I await, failures here will fail the booking creation?
      // Usually webhooks are async background tasks.
      // Requirement 10.1: "WHEN a booking is created... SHALL send..."
      // Usually implies after specific success.
      // For now, I will NOT rethrow to ensure the main flow succeeds even if webhook fails,
      // unless strict consistency is required. But I'll leave the throw in for now to be explicit
      // and let the caller decide (or wrap in try/catch in the caller).
      // Actually, looking at the code, I am `await`ing this.sendWebhook.
      // I'll assume for now we want to log error and NOT crash the app if webhook fails after 3 retries.
    }
  }
}
