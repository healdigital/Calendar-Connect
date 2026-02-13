"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext } from "react";

type OrganizationBrandingData = {
  id: number;
  slug: string;
  fullDomain: string;
  brandColor: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
};

export type OrganizationBranding = OrganizationBrandingData | null;

const OrgBrandingContext = createContext<OrganizationBranding>(null);

export const OrgBrandingProvider = ({
  children,
  value = null,
}: {
  children: ReactNode;
  value?: OrganizationBranding;
}) => {
  return <OrgBrandingContext.Provider value={value}>{children}</OrgBrandingContext.Provider>;
};

export const useOrgBranding = () => useContext(OrgBrandingContext);
