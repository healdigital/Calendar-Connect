import logger from "@calcom/lib/logger";
import { z } from "zod";

export const ZTriggerFormSubmittedNoEventWorkflowPayloadSchema = z.object({
  formId: z.string(),
  responseId: z.string(),
});

const log = logger.getSubLogger({ prefix: ["[tasker] triggerFormSubmittedNoEventWorkflow"] });

export async function triggerFormSubmittedNoEventWorkflow(_payload: string): Promise<void> {
  log.debug("triggerFormSubmittedNoEventWorkflow disabled for Open Source edition");
}
