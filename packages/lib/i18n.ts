/* eslint-disable @typescript-eslint/no-var-requires */
import i18nConfig from "@calcom/config/next-i18next.config";

const { i18n } = i18nConfig;

// Workaround for using router.locales from old router
export const locales = i18n.locales as string[];

export const localeOptions = locales.map((locale) => ({
  value: locale,
  label: new Intl.DisplayNames(locale, { type: "language" }).of(locale) || "",
}));

export const defaultLocaleOption = localeOptions.find(
  (locale) => locale.value === i18n.defaultLocale
) as (typeof localeOptions)[number];
