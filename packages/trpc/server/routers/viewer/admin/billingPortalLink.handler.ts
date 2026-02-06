import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TBillingPortalLinkSchema } from "./billingPortalLink.schema";

type GetOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TBillingPortalLinkSchema;
};

const billingPortalLinkHandler = async ({ input }: GetOptions) => {
  throw new TRPCError({ code: "NOT_IMPLEMENTED" });
};

export default billingPortalLinkHandler;
