// import { createSignature, generateNonce } from "@calcom/features/ee/common/server/private-api-utils";
// import { getDeploymentSignatureToken } from "@calcom/features/ee/deployment/lib/getDeploymentKey";
// import { DeploymentRepository } from "@calcom/features/ee/deployment/repositories/DeploymentRepository";
// import { CALCOM_PRIVATE_API_ROUTE } from "@calcom/lib/constants";
import logger from "@calcom/lib/logger";
import { prisma } from "@calcom/prisma";
import { z } from "zod";
import type { TrpcSessionUser } from "../../../types";
import type { TResendPurchaseCompleteEmailSchema } from "./resendPurchaseCompleteEmail.schema";

type GetOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TResendPurchaseCompleteEmailSchema;
};

const resendPurchaseCompleteEmailHandler = async ({ input }: GetOptions) => {
  throw new Error("Private API route does not exist in .env");
};

export default resendPurchaseCompleteEmailHandler;
