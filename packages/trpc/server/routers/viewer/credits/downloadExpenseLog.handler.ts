import { CreditsRepository } from "@calcom/features/credits/repositories/CreditsRepository";
import { PermissionCheckService } from "@calcom/features/pbac/services/permission-check.service";
import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TDownloadExpenseLogSchema } from "./downloadExpenseLog.schema";

type DownloadExpenseLogOptions = {
  ctx: {
    user: { id: number };
  };
  input: TDownloadExpenseLogSchema;
};

const headers = [
  "Date",
  "Credits",
  "Type",
  "Booking UID",
  "Number of Segments",
  "Call Duration",
  "External Ref",
  "Phone Number",
  "Email",
];

export const downloadExpenseLogHandler = async ({ ctx, input }: DownloadExpenseLogOptions) => {
  // Stubbing for OS
  return { csvData: "" };
};
