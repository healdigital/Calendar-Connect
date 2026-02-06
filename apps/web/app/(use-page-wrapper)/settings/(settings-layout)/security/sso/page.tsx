import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("sso_configuration"),
    (t) => t("sso_configuration_description"),
    undefined,
    undefined,
    "/settings/security/sso"
  );

const Page = async () => {
  const t = await getTranslate();

  return (
    <SettingsHeader
      title={t("sso_configuration")}
      description={t("sso_configuration_description")}
      borderInShellHeader={true}>
      <div className="p-8 bg-white border border-dashed rounded-lg border-subtle text-center">
        <p className="text-subtle">SSO configuration is currently unavailable in this version.</p>
      </div>
    </SettingsHeader>
  );
};

export default Page;
