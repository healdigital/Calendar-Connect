"use client";

import { FeatureProvider } from "@calcom/features/flags/context/provider";
import { useFlags } from "@calcom/web/modules/feature-flags/hooks/useFlags";
import type { PageWrapperProps } from "@components/PageWrapperAppDir";
import useIsBookingPage from "@lib/hooks/useIsBookingPage";
import useIsThemeSupported from "@lib/hooks/useIsThemeSupported";
import { useNuqsParams } from "@lib/hooks/useNuqsParams";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getThemeProviderProps } from "./getThemeProviderProps";

const getEmbedNamespace = (searchParams: any) => {
  return typeof window !== "undefined"
    ? (window as any).getEmbedNamespace()
    : (searchParams.get("embed") ?? null);
};

type CalcomThemeProps = Readonly<{
  isBookingPage: boolean;
  nonce: string | undefined;
  children: React.ReactNode;
  isThemeSupported: boolean;
}>;

const CalcomThemeProvider = (props: CalcomThemeProps) => {
  const searchParams = useSearchParams();
  const embedNamespace = searchParams ? getEmbedNamespace(searchParams) : null;
  const isEmbedMode = typeof embedNamespace === "string";
  const pathname = usePathname();
  const { key, ...themeProviderProps } = getThemeProviderProps({
    props,
    isEmbedMode,
    embedNamespace,
    pathname,
    searchParams,
  } as any);

  return (
    <ThemeProvider key={key} {...themeProviderProps}>
      {typeof window !== "undefined" && !isEmbedMode && (
        <style jsx global>
          {`
            .dark {
              color-scheme: dark;
            }
          `}
        </style>
      )}
      {props.children}
    </ThemeProvider>
  );
};

function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const flags = useFlags();
  return <FeatureProvider value={flags}>{children}</FeatureProvider>;
}

function OrgBrandProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const AppProviders = (props: PageWrapperProps) => {
  const isBookingPage = useIsBookingPage();
  const isThemeSupported = useIsThemeSupported();
  const nuqsParams = useNuqsParams();

  return (
    <TooltipProvider>
      <CalcomThemeProvider
        nonce={props.nonce}
        isThemeSupported={isThemeSupported}
        isBookingPage={props.isBookingPage || isBookingPage}>
        <NuqsAdapter {...nuqsParams}>
          <FeatureFlagsProvider>
            <OrgBrandProvider>{props.children}</OrgBrandProvider>
          </FeatureFlagsProvider>
        </NuqsAdapter>
      </CalcomThemeProvider>
    </TooltipProvider>
  );
};

export default AppProviders;
