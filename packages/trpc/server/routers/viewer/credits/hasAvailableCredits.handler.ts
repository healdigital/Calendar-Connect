import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import type { THasAvailableCreditsSchema } from "./hasAvailableCredits.schema";

type HasAvailableCreditsOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: THasAvailableCreditsSchema;
};

export const hasAvailableCreditsHandler = async ({ ctx, input }: HasAvailableCreditsOptions) => {
  // Always return true (unlimited credits) for open source
  return true;
};
