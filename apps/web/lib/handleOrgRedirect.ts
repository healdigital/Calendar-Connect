import type { ParsedUrlQuery } from "node:querystring";
import { SINGLE_ORG_SLUG } from "@calcom/lib/constants";
import prisma from "@calcom/prisma";
import type { RedirectType } from "@calcom/prisma/enums";
import type { GetServerSidePropsContext } from "next";

const ORG_REDIRECTION_QUERY_PARAM = "orgRedirection";

type HandleOrgRedirectParams = {
  slugs: string[];
  redirectType: RedirectType;
  eventTypeSlug?: string | null;
  context: GetServerSidePropsContext;
  currentOrgDomain: string | null;
};

type RedirectWithOriginAndSearchString = {
  origin: string | null;
  destinationPath: string;
  searchString: string;
};

const isOrgRedirection = (query: ParsedUrlQuery) => {
  const value = query[ORG_REDIRECTION_QUERY_PARAM];
  if (Array.isArray(value)) return value.includes("true");
  return value === "true";
};

const getSearchString = (query: ParsedUrlQuery) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === ORG_REDIRECTION_QUERY_PARAM || value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.append(key, value);
  }

  params.set(ORG_REDIRECTION_QUERY_PARAM, "true");
  return `?${params.toString()}`;
};

const getRedirectPath = (slugs: string[], eventTypeSlug?: string | null) => {
  const basePath = slugs.join("+");
  const pathParts = [basePath, eventTypeSlug].filter(Boolean);

  if (pathParts.length === 0) return "";
  return `/${pathParts.join("/")}`;
};

const getPathnameWithoutLeadingSlash = (toUrl: string) => {
  try {
    return new URL(toUrl).pathname.replace(/^\//, "");
  } catch {
    return toUrl.replace(/^\//, "");
  }
};

export async function getRedirectWithOriginAndSearchString({
  slugs,
  redirectType,
  eventTypeSlug,
  context,
  currentOrgDomain,
}: HandleOrgRedirectParams): Promise<RedirectWithOriginAndSearchString | null> {
  const redirects = await prisma.tempOrgRedirect.findMany({
    where: {
      type: redirectType,
      from: {
        in: slugs,
      },
      fromOrgId: 0,
    },
  });

  if (!redirects.length) return null;

  const redirectsByFrom = new Map(redirects.map((redirect) => [redirect.from, redirect]));

  const redirectedSlugs = slugs.map((slug) => {
    const redirect = redirectsByFrom.get(slug);
    if (!redirect) return slug;
    return getPathnameWithoutLeadingSlash(redirect.toUrl);
  });

  const firstRedirect = slugs.map((slug) => redirectsByFrom.get(slug)).find(Boolean);
  if (!firstRedirect) return null;

  const isSingleOrgModeRedirect = Boolean(SINGLE_ORG_SLUG && currentOrgDomain);

  let origin: string | null = null;
  if (!isSingleOrgModeRedirect) {
    origin = new URL(firstRedirect.toUrl).origin;
  }

  const destinationPath = getRedirectPath(redirectedSlugs, eventTypeSlug);

  return {
    origin,
    destinationPath: isSingleOrgModeRedirect && destinationPath === "" ? "/" : destinationPath,
    searchString: getSearchString(context.query),
  };
}

export async function handleOrgRedirect({
  slugs,
  redirectType,
  eventTypeSlug,
  context,
  currentOrgDomain,
}: HandleOrgRedirectParams): Promise<{ redirect: { permanent: false; destination: string } } | null> {
  if (SINGLE_ORG_SLUG && isOrgRedirection(context.query)) return null;
  if (!SINGLE_ORG_SLUG && currentOrgDomain) return null;

  const redirectWithOriginAndSearchString = await getRedirectWithOriginAndSearchString({
    slugs,
    redirectType,
    eventTypeSlug,
    context,
    currentOrgDomain,
  });

  if (!redirectWithOriginAndSearchString) return null;

  return {
    redirect: {
      permanent: false,
      destination: `${redirectWithOriginAndSearchString.origin ?? ""}${
        redirectWithOriginAndSearchString.destinationPath
      }${redirectWithOriginAndSearchString.searchString}`,
    },
  };
}
