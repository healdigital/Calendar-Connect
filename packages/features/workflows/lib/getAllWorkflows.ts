import type { Prisma } from "@calcom/prisma/client";

// OSS stub for workflow select
export const workflowSelect = {
  id: true,
  name: true,
} satisfies Prisma.WorkflowSelect;
