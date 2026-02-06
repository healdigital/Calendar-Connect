"use client";

import React, { createContext, type ReactNode, useContext } from "react";

const OrgBrandingContext = createContext({
  brandColor: null,
  bannerUrl: null,
  logoUrl: null,
});

export const OrgBrandingProvider = ({ children }: { children: ReactNode }) => {
  return (
    <OrgBrandingContext.Provider value={{ brandColor: null, bannerUrl: null, logoUrl: null }}>
      {children}
    </OrgBrandingContext.Provider>
  );
};

export const useOrgBranding = () => useContext(OrgBrandingContext);
