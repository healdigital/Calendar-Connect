import { WEBAPP_URL } from "@calcom/lib/constants";

export const getOrgDomainConfigFromHostname = ({ hostname }: { hostname: string }) => {
  return {
    isValidOrgDomain: false,
    currentOrgDomain: null,
  };
};

/** @deprecated Use getOrgDomainConfigFromHostname or orgDomainConfig */
export const getOrgDomainConfig = async (req: any) => {
  return {
    isValidOrgDomain: false,
    currentOrgDomain: null,
  };
};

export const orgDomainConfig = (req: any) => {
  return {
    isValidOrgDomain: false,
    currentOrgDomain: null,
  };
};

export const subdomainSuffix = () => {
  try {
    return new URL(WEBAPP_URL).hostname;
  } catch (e) {
    return "";
  }
};

export const getOrgFullOrigin = (slug: string, options?: { protocol?: boolean }) => {
  return WEBAPP_URL;
};

export const getSlugOrRequestedSlug = (slug: string | string[] | undefined) => {
  return Array.isArray(slug) ? slug[0] : slug;
};

export const whereClauseForOrgWithSlugOrRequestedSlug = (slug: string | string[] | undefined) => {
  return {};
};
