"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { MembershipRole } from "@calcom/prisma/enums";
import { Button } from "@calcom/ui/components/button";
import { useRouter } from "next/navigation";

export const CreateNewWebhookButton = () => {
  const router = useRouter();
  const { t } = useLocale();
  const createFunction = (teamId?: number, platform?: boolean) => {
    if (platform) {
      router.push(`webhooks/new${platform ? `?platform=${platform}` : ""}`);
    } else {
      router.push(`webhooks/new${teamId ? `?teamId=${teamId}` : ""}`);
    }
  };

  return (
    <Button color="secondary" onClick={() => createFunction()} data-testid="new_webhook">
      {t("new_webhook")}
    </Button>
  );
};

export default CreateNewWebhookButton;
