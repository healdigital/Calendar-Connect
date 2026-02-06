import logger from "@calcom/lib/logger";
import { z } from "zod";

export const cancelProrationReminderPayloadSchema = z.object({
  prorationId: z.string(),
  teamId: z.number(),
});

const log = logger.getSubLogger({ prefix: ["cancelProrationReminder"] });

export async function cancelProrationReminder(_payload: string): Promise<void> {
  log.debug("cancelProrationReminder disabled for Open Source edition");
}
