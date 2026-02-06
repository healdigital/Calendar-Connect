import type { Workflow } from "@calcom/features/workflows/lib/types";

/**
 * WorkflowService - OSS stub for workflow operations.
 * Workflows are not implemented in the OSS version.
 */
export class WorkflowService {
  /**
   * Gets all workflows from a routing form.
   * OSS stub - returns empty array.
   */
  static async getAllWorkflowsFromRoutingForm(routingFormId: string): Promise<Workflow[]> {
    return [];
  }

  /**
   * Schedules workflows for a form submission.
   * OSS stub - no-op.
   */
  static async scheduleFormWorkflows(params: {
    formId: string;
    formResponseId: number;
    workflows: Workflow[];
  }): Promise<void> {
    // OSS stub - no-op
  }

  /**
   * Schedules workflows for a booking.
   * OSS stub - no-op.
   */
  static async scheduleWorkflows(params: {
    workflows: Workflow[];
    bookingId: number;
    userId: number;
  }): Promise<void> {
    // OSS stub - no-op
  }

  /**
   * Schedules workflows filtered by trigger event.
   * OSS stub - no-op.
   */
  static async scheduleWorkflowsFilteredByTriggerEvent(params: {
    workflows: Workflow[];
    smsReminderNumber: string | null;
    calendarEvent: unknown;
    hideBranding: boolean;
    triggers: unknown[];
    creditCheckFn?: (userId: number) => Promise<boolean>;
  }): Promise<void> {
    // OSS stub - no-op
  }
}
