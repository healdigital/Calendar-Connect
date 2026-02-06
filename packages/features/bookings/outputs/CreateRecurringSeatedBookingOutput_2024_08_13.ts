import type { BookingHost, EventType } from "./BookingOutput_2024_08_13";
import type { SeatedAttendee } from "./CreateSeatedBookingOutput_2024_08_13";

export type CreateRecurringSeatedBookingOutput_2024_08_13 = {
  id: number;
  uid: string;
  title: string;
  description: string;
  hosts: BookingHost[];
  status: "cancelled" | "accepted" | "rejected" | "pending";
  cancellationReason?: string;
  cancelledByEmail?: string;
  reschedulingReason?: string;
  rescheduledByEmail?: string;
  rescheduledFromUid?: string;
  rescheduledToUid?: string;
  start: string;
  end: string;
  duration: number;
  /** @deprecated Deprecated - rely on 'eventType' object containing the id instead. */
  eventTypeId: number;
  eventType: EventType;
  /** @deprecated Deprecated - rely on 'location' field instead. */
  meetingUrl?: string;
  location: string;
  absentHost: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  rating?: number;
  icsUid?: string;
  seatUid: string;
  attendees: SeatedAttendee[];
  recurringBookingUid: string;
};
