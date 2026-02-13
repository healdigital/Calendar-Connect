"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { EmptyScreen } from "@calcom/ui";

export default function AdminBillingView() {
  const { t } = useLocale();

  return (
    <EmptyScreen
      headline={t("admin_billing_not_available")}
      description={t("admin_billing_removed_description")}
      Icon="credit-card"
    />
  );
}
