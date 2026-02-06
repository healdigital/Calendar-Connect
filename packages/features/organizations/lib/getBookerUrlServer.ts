import { WEBAPP_URL } from "@calcom/lib/constants";

export const getBookerBaseUrl = async (orgId: number | null) => {
  return WEBAPP_URL;
};
