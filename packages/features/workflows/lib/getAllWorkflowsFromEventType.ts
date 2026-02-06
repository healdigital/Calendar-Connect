import type { Workflow } from "@calcom/features/workflows/lib/types";
import type { EventType } from "@calcom/prisma/client";

/**
 * Gets all workflows associated with an event type.
 * OSS stub - returns empty array as workflows are not implemented in OSS.
 *
 * @param eventType - The event type to get workflows for
 * @param userId - The user ID (optional)
 * @returns Empty array (workflows not implemented in OSS)
 */
export async function getAllWorkflowsFromEventType(
  eventType: Pick<EventType, "id"> | null,
  userId?: number | null
): Promise<Workflow[]> {
  // OSS stub - workflows are not implemented
  return [];
}
