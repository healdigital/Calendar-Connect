import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("system_blocklist"),
    (t) => t("system_blocklist_description"),
    undefined,
    undefined,
    "/settings/admin/blocklist"
  );

const Page = async () => {
  const t = await getTranslate();
  return (
    <SettingsHeader title={t("system_blocklist")} description={t("system_blocklist_description")}>
      <div className="p-8 bg-white border border-dashed rounded-lg border-subtle text-center">
        <p className="text-subtle">System blocklist view is currently unavailable in this version.</p>
      </div>
    </SettingsHeader>
  );
};

export default Page;
