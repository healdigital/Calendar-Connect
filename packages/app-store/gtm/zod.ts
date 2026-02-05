import { createPrefixedIdSchema } from "@calcom/app-store/_lib/analytics-schemas";
import { eventTypeAppCardZod } from "@calcom/app-store/eventTypeAppCardZod";
import { z } from "zod";

export const appDataSchema = eventTypeAppCardZod.merge(
  z.object({
    trackingId: createPrefixedIdSchema({ prefix: "GTM-", addPrefixIfMissing: true, allowEmpty: false }),
  })
);

export const appKeysSchema = z.object({});
