import logger from "@calcom/lib/logger";
import { safeStringify } from "@calcom/lib/safeStringify";
import { z } from "zod";

const log = logger.getSubLogger({ prefix: ["sendProrationReminderEmail"] });

export const sendProrationReminderEmailPayloadSchema = z.object({
  prorationId: z.string(),
  teamId: z.number(),
});

export async function sendProrationReminderEmail(payload: string): Promise<void> {
  log.debug(`sendProrationReminderEmail disabled for Open Source edition. Payload: ${payload}`);
}
