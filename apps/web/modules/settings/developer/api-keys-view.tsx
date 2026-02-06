"use client";

import SettingsHeader from "@calcom/features/settings/appDir/SettingsHeader";
import { APP_NAME } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { EmptyScreen } from "@calcom/ui/components/empty-screen";

const ApiKeysView = () => {
  const { t } = useLocale();

  return (
    <SettingsHeader
      title={t("api_keys")}
      description={t("create_first_api_key_description", { appName: APP_NAME })}
      borderInShellHeader={true}>
      <>
        <EmptyScreen
          Icon="link"
          headline={t("api_keys")}
          description={t("create_first_api_key_description", { appName: APP_NAME })}
          className="rounded-b-lg rounded-t-none border-t-0"
        />
      </>
    </SettingsHeader>
  );
};

export default ApiKeysView;
