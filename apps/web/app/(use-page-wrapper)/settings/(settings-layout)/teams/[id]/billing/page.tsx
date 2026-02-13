import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) =>
  await _generateMetadata(
    (t) => t("admin_billing_title"),
    (t) => t("admin_billing_description"),
    undefined,
    undefined,
    `/settings/teams/${(await params).id}/billing`
  );

const Page = async () => {
  const t = await getTranslate();

  return (
    <SettingsHeader title={t("admin_billing_title")} description={t("admin_billing_description")}>
      <div>{t("admin_billing_description")}</div>
    </SettingsHeader>
  );
};

export default Page;
