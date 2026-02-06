import process from "node:process";
// import LicenseKeyService from "@calcom/features/ee/common/server/LicenseKeyService";
import type { TrpcSessionUser } from "../../../types";
import type { TValidateLicenseInputSchema } from "./validateLicense.schema";

type ValidateLicenseOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TValidateLicenseInputSchema;
};

export const validateLicenseHandler = async ({ input }: ValidateLicenseOptions) => {
  // Always return valid for open source
  return {
    valid: true,
    message: "License key is valid (Open Source)",
  };
};
