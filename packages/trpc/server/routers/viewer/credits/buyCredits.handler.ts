import process from "node:process";
import { WEBAPP_URL } from "@calcom/lib/constants";
import prisma from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";
import type { TBuyCreditsSchema } from "./buyCredits.schema";

type BuyCreditsOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TBuyCreditsSchema;
};

export const buyCreditsHandler = async (_args: any) => {
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message: "Credits are not supported in Open Source edition",
  });
};
