/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("node:path");
const i18nModule = require("@calcom/config/next-i18next.config");
const i18nConfig = i18nModule.default || i18nModule;

/** @type {import("next-i18next").UserConfig} */
const config = {
  ...i18nConfig,
  localePath: path.resolve("../../web/public/static/locales"),
};

module.exports = config;
