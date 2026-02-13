import { WEBAPP_URL } from "@calcom/lib/constants";

type OrgDomainConfig = {
  isValidOrgDomain: boolean;
  currentOrgDomain: string | null;
};

const getHostnameWithoutPort = (hostname: string) => hostname.split(":")[0];

type OrgDomainInput =
  | { headers?: { host?: string } }
  | {
      hostname?: string;
      forcedSlug?: string;
      isPlatform?: boolean;
    }
  | undefined;

const resolveHostname = (input: OrgDomainInput) => {
  if (!input) return "";
  if ("hostname" in input && input.hostname) return input.hostname;
  if ("headers" in input) return input.headers?.host ?? "";
  return "";
};

export const getOrgDomainConfigFromHostname = ({ hostname }: { hostname: string }): OrgDomainConfig => {
  if (!hostname) {
    return {
      isValidOrgDomain: false,
      currentOrgDomain: null,
    };
  }

  const currentHostname = getHostnameWithoutPort(hostname);

  let webappHostname = "";
  try {
    webappHostname = new URL(WEBAPP_URL).hostname;
  } catch {
    webappHostname = "";
  }

  if (!webappHostname) {
    return {
      isValidOrgDomain: false,
      currentOrgDomain: null,
    };
  }

  if (currentHostname === webappHostname) {
    return {
      isValidOrgDomain: false,
      currentOrgDomain: null,
    };
  }

  if (currentHostname.endsWith(`.${webappHostname}`)) {
    const orgSlug = currentHostname.slice(0, currentHostname.length - webappHostname.length - 1);
    return {
      isValidOrgDomain: Boolean(orgSlug),
      currentOrgDomain: orgSlug || null,
    };
  }

  return {
    isValidOrgDomain: false,
    currentOrgDomain: null,
  };
};

/** @deprecated Use getOrgDomainConfigFromHostname or orgDomainConfig */
export const getOrgDomainConfig = async (req: OrgDomainInput) =>
  getOrgDomainConfigFromHostname({ hostname: resolveHostname(req) });

export const orgDomainConfig = (
  req: OrgDomainInput,
  _orgSlug?: string | string[]
): OrgDomainConfig => getOrgDomainConfigFromHostname({ hostname: resolveHostname(req) });

export const subdomainSuffix = () => {
  try {
    return new URL(WEBAPP_URL).hostname;
  } catch (e) {
    return "";
  }
};

export const getOrgFullOrigin = (slug: string | null, options?: { protocol?: boolean }) => {
  try {
    const webapp = new URL(WEBAPP_URL);
    const protocolPrefix = options?.protocol === false ? "" : `${webapp.protocol}//`;

    if (!slug) return `${protocolPrefix}${webapp.host}`;

    return `${protocolPrefix}${slug}.${webapp.host}`;
  } catch {
    return WEBAPP_URL;
  }
};

export const getSlugOrRequestedSlug = (slug: string | string[] | undefined) => {
  return Array.isArray(slug) ? slug[0] : slug;
};

export const whereClauseForOrgWithSlugOrRequestedSlug = (slug: string | string[] | undefined) => {
  const normalizedSlug = getSlugOrRequestedSlug(slug);
  if (!normalizedSlug) return {};

  return {
    OR: [{ slug: normalizedSlug }, { requestedSlug: normalizedSlug }],
  };
};
