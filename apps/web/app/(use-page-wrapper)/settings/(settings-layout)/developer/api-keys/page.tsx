import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("api_keys"),
    (t) => t("api_keys_description"),
    undefined,
    undefined,
    "/settings/developer/api-keys"
  );

const Page = async () => {
  const t = await getTranslate();

  return (
    <SettingsHeader title={t("api_keys")} description={t("api_keys_description")}>
      <div className="p-8 bg-white border border-dashed rounded-lg border-subtle text-center">
        <p className="text-subtle">API keys are currently unavailable in this version.</p>
      </div>
    </SettingsHeader>
  );
};

export default Page;
