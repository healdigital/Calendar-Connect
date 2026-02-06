import logger from "@calcom/lib/logger";
import z from "zod";

export const scanWorkflowBodySchema = z.object({
  userId: z.number(),
  workflowStepIds: z.array(z.number()).optional(),
  workflowStepId: z.number().optional(),
  createdAt: z.string().optional(),
});

const log = logger.getSubLogger({ prefix: ["[tasker] scanWorkflowBody"] });

export async function scanWorkflowBody(_payload: string) {
  log.debug("scanWorkflowBody disabled for Open Source edition");
}

export async function iffyScanBody(_body: string, _workflowStepId: number) {
  return false;
}
