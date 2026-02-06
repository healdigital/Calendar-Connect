import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { Button } from "@calcom/ui/components/button";
import { _generateMetadata, getTranslate } from "app/_utils";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("users"),
    (t) => t("admin_users_description"),
    undefined,
    undefined,
    "/settings/admin/users"
  );

const Page = async () => {
  const t = await getTranslate();
  return (
    <SettingsHeader
      title={t("users")}
      description={t("admin_users_description")}
      CTA={
        <div className="mt-4 space-x-5 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button href="/settings/admin/users/add">Add user</Button>
        </div>
      }>
      <div className="p-8 bg-white border border-dashed rounded-lg border-subtle text-center">
        <p className="text-subtle">User management view is currently unavailable in this version.</p>
      </div>
    </SettingsHeader>
  );
};

export default Page;
