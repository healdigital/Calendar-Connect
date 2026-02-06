import { FilterHostsService } from "@calcom/features/bookings/lib/host-filtering/filterHostsBySameRoundRobinHost";
import { QualifiedHostsService } from "@calcom/features/bookings/lib/host-filtering/findQualifiedHostsWithDelegationCredentials";
import { BusyTimesService } from "@calcom/features/busyTimes/services/getBusyTimes";
import { NoSlotsNotificationService } from "@calcom/features/slots/handleNotificationWhenNoSlots";
import { AvailableSlotsService } from "@calcom/trpc/server/routers/viewer/slots/util";

export { AvailableSlotsService };

export { BusyTimesService };

export { QualifiedHostsService };

export { FilterHostsService };
export { NoSlotsNotificationService };

/**
 * Stub for validateRoundRobinSlotAvailability to remove EE dependency.
 * Always returns true (void) as fallback for open source version.
 */
export const validateRoundRobinSlotAvailability = async (...args: any[]) => {
  return;
};
