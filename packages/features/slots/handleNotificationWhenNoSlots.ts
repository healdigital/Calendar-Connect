import type { Dayjs } from "@calcom/dayjs";

type EventDetails = {
  username: string;
  eventSlug: string;
  startTime: Dayjs;
  endTime: Dayjs;
  visitorTimezone?: string;
  visitorUid?: string;
};

export interface INoSlotsNotificationService {
  handleNotificationWhenNoSlots(args: {
    eventDetails: EventDetails;
    orgDetails: { currentOrgDomain: string | null };
    teamId?: number;
  }): Promise<void>;
}

export class NoSlotsNotificationService {
  constructor(public readonly dependencies: any) {}

  async handleNotificationWhenNoSlots(_args: {
    eventDetails: EventDetails;
    orgDetails: { currentOrgDomain: string | null };
    teamId?: number;
  }) {
    // Disabled for Open Source edition
  }
}
