"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { EmptyScreen } from "@calcom/ui/components/empty-screen";

type Props = {
  eventType: any;
  workflows: any[];
};

function EventWorkflowsTab(props: Props) {
  const { t } = useLocale();

  return (
    <div className="pt-2 before:border-0">
      <EmptyScreen Icon="zap" headline={t("workflows")} description={t("no_workflows_description")} />
    </div>
  );
}

export default EventWorkflowsTab;
