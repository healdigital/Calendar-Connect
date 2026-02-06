import logger from "@calcom/lib/logger";
import { z } from "zod";

export const sendAwaitingPaymentEmailPayloadSchema = z.object({
  bookingId: z.number(),
  paymentId: z.number(),
  attendeeSeatId: z.string().nullable().optional(),
});

const log = logger.getSubLogger({ prefix: ["sendAwaitingPaymentEmail"] });

export async function sendAwaitingPaymentEmail(_payload: string): Promise<void> {
  log.debug("sendAwaitingPaymentEmail disabled for Open Source edition");
}
