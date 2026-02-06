import logger from "@calcom/lib/logger";
import { z } from "zod";

export const sendProrationInvoiceEmailPayloadSchema = z.object({
  prorationId: z.string(),
  teamId: z.number(),
});

const log = logger.getSubLogger({ prefix: ["sendProrationInvoiceEmail"] });

export async function sendProrationInvoiceEmail(_payload: string): Promise<void> {
  log.debug("sendProrationInvoiceEmail disabled for Open Source edition");
}
