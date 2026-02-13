import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) =>
  await _generateMetadata(
    (t) => t("team_members"),
    (t) => t("members_team_description"),
    undefined,
    undefined,
    `/settings/teams/${(await params).id}/members`
  );

const Page = async () => {
  const t = await getTranslate();

  return (
    <SettingsHeader title={t("team_members")} description={t("members_team_description")}>
      <div>Team members management is not available in Open Source edition.</div>
    </SettingsHeader>
  );
};

export default Page;
