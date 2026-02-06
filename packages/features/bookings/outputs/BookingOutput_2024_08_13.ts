export type BookingHost = {
  id: number;
  name: string;
  email: string;
  displayEmail: string;
  timeZone: string;
  absent: boolean;
};

export type EventType = {
  id: number;
  slug: string;
  title: string;
  length: number;
  description?: string;
};

export type BookingAttendee = {
  name: string;
  email: string;
  displayEmail: string;
  timeZone: string;
  absent: boolean;
};

export type BookingOutput_2024_08_13 = {
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
  attendees: BookingAttendee[];
  guests?: string[];
  bookingFieldsResponses: Record<string, unknown>;
};
