import logger from "@calcom/lib/logger";
import z from "zod";

export const scanWorkflowUrlsSchema = z.object({
  userId: z.number(),
  workflowStepId: z.number().optional(),
  eventTypeId: z.number().optional(),
  urls: z.array(z.string()).optional(),
  pendingScans: z.array(z.object({ url: z.string(), scanId: z.string() })).optional(),
  pollAttempts: z.number().optional(),
  createdAt: z.string().optional(),
  whitelistWorkflows: z.boolean().optional(),
});

const log = logger.getSubLogger({ prefix: ["[tasker] scanWorkflowUrls"] });

export async function scanWorkflowUrls(_payload: string) {
  log.debug("scanWorkflowUrls disabled for Open Source edition");
}

export async function submitWorkflowStepForUrlScanning(
  _workflowStepId: number,
  _reminderBody: string,
  _userId: number,
  _whitelistWorkflows?: boolean
) {
  log.debug("submitWorkflowStepForUrlScanning disabled for Open Source edition");
}

export async function submitUrlForUrlScanning(
  _url: string,
  _userId: number,
  _eventTypeId: number,
  _whitelistWorkflows?: boolean
) {
  log.debug("submitUrlForUrlScanning disabled for Open Source edition");
}
