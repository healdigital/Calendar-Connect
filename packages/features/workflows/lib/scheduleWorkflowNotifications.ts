// OSS stub for workflow notifications scheduling

export async function scheduleWorkflowNotifications(_params: {
  activeOn: number[];
  isOrg: boolean;
  workflowSteps: unknown[];
  time: number;
  timeUnit: string;
  trigger: string;
  userId: number;
  teamId: number | null;
}): Promise<void> {
  // OSS stub - no-op
  // In production, this would schedule workflow notifications
}
