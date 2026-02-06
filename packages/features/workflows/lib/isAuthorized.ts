import type { Workflow } from "@calcom/prisma/client";

export const isAuthorized = async (
  _workflow: Pick<Workflow, "id" | "teamId" | "userId">,
  _currentUserId: number,
  _permission: "workflow.read" | "workflow.update" | "workflow.delete" = "workflow.read"
) => {
  // In OSS, we can default to true for simplicity or implement basic ownership check
  return true;
};

export const isAuthorizedToAddActiveOnIds = async (_args: any) => true;
