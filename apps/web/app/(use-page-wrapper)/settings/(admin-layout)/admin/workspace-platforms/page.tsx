import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("workspace_platforms"),
    (t) => t("workspace_platforms_description"),
    undefined,
    undefined,
    "/settings/admin/workspace-platforms"
  );

const Page = async () => {
  const t = await getTranslate();
  return (
    <SettingsHeader title={t("workspace_platforms")} description={t("workspace_platforms_description")}>
      <div className="p-8 bg-white border border-dashed rounded-lg border-subtle text-center">
        <p className="text-subtle">Workspace platforms view is currently unavailable in this version.</p>
      </div>
    </SettingsHeader>
  );
};

export default Page;
