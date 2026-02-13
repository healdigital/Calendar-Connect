import { WizardLayout } from "@calcom/ui/components/layout/WizardLayout";
import type { ReactNode } from "react";

export const LayoutWrapper = ({ children }: { children: ReactNode }) => (
  <WizardLayout currentStep={2} maxSteps={3}>
    {children}
  </WizardLayout>
);

export default function AddNewTeamMembers() {
  return <div>Team onboarding is not available in this build.</div>;
}
