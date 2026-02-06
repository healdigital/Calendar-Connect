import { WEBAPP_URL } from "@calcom/lib/constants";

export const getBookerBaseUrlSync = (orgSlug: string | null) => {
  return WEBAPP_URL;
};
