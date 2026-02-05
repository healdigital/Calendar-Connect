import { alphanumericIdSchema, safeUrlSchema } from "@calcom/app-store/_lib/analytics-schemas";
import { eventTypeAppCardZod } from "@calcom/app-store/eventTypeAppCardZod";
import { z } from "zod";

export const appDataSchema = eventTypeAppCardZod.merge(
  z.object({
    SITE_ID: alphanumericIdSchema.optional(),
    SCRIPT_URL: safeUrlSchema.optional(),
  })
);

export const appKeysSchema = z.object({});
