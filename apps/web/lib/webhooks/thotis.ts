import type { Booking } from "@calcom/prisma/client";

interface ThotisBookingResponses {
  email?: string;
  name?: string;
}

/**
 * Service for sending webhooks to the main Thotis platform
 */
const thotisWebhooks = {
  /**
   * Triggered when a new booking is created
   */
  onBookingCreated: async (
    booking: Pick<Booking, "id" | "userId" | "responses" | "startTime">,
    studentProfileId: string,
    fieldOfStudy: string | undefined
  ) => {
    await sendWebhook("booking-created", {
      bookingId: booking.id,
      studentId: booking.userId, // This is the mentor's user ID
      studentProfileId,
      attendeeEmail: (booking.responses as ThotisBookingResponses)?.email,
      attendeeName: (booking.responses as ThotisBookingResponses)?.name,
      startTime: booking.startTime,
      field: fieldOfStudy,
    });
  },

  /**
   * Triggered when a booking is cancelled
   */
  onBookingCancelled: async (booking: Pick<Booking, "id">, reason: string) => {
    await sendWebhook("booking-cancelled", {
      bookingId: booking.id,
      reason,
      cancelledAt: new Date().toISOString(),
    });
  },

  /**
   * Triggered when a booking is rescheduled
   */
  onBookingRescheduled: async (
    booking: Pick<Booking, "id">,
    newStartTime: Date,
    newEndTime: Date,
    newMeetLink: string
  ) => {
    await sendWebhook("booking-rescheduled", {
      bookingId: booking.id,
      newStartTime,
      newEndTime,
      newMeetLink,
      rescheduledAt: new Date().toISOString(),
    });
  },

  /**
   * Triggered when a session is completed
   */
  onBookingCompleted: async (booking: Pick<Booking, "id" | "userId" | "metadata">, duration: number) => {
    const metadata = booking.metadata as { studentProfileId?: string } | null;
    await sendWebhook("booking-completed", {
      bookingId: booking.id,
      studentId: booking.userId,
      studentProfileId: metadata?.studentProfileId,
      duration,
      completedAt: new Date().toISOString(),
    });
  },

  /**
   * Triggered when a reminder is sent
   */
  onReminder: async (booking: Pick<Booking, "id">, type: "24h" | "1h") => {
    await sendWebhook("reminder-sent", {
      bookingId: booking.id,
      type,
      sentAt: new Date().toISOString(),
    });
  },
};

export { thotisWebhooks };

const sendWebhook = async (event: string, payload: Record<string, unknown>) => {
  const webhookUrl = process.env.THOTIS_WEBHOOK_URL;
  const webhookSecret = process.env.THOTIS_WEBHOOK_SECRET;

  if (!webhookUrl) {
    console.debug(`[Thotis Webhook] Skipping ${event} - THOTIS_WEBHOOK_URL not set`);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret || "",
        "X-Thotis-Event": event,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Thotis Webhook] Failed to send ${event}: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[Thotis Webhook] Error sending ${event}`, error);
  }
};
