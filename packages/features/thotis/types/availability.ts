/**
 * Represents an availability time slot for Thotis mentoring sessions
 */
export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
}
