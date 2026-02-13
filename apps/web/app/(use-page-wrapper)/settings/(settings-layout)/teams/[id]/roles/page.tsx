import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return await _generateMetadata(
    (t) => t("roles_and_permissions"),
    (t) => t("roles_and_permissions_description"),
    undefined,
    undefined,
    `/settings/teams/${id}/roles`
  );
};

const Page = async () => {
  const t = await getTranslate();

  return (
    <SettingsHeader title={t("roles_and_permissions")} description={t("roles_and_permissions_description")}>
      <div>Roles and permissions are not available in Open Source edition.</div>
    </SettingsHeader>
  );
};

export default Page;
