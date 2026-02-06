"use client";

import { Button } from "@calcom/ui/components/button";
import { WizardLayout } from "@calcom/ui/components/layout";
import { useRouter } from "next/navigation";

const CreateNewTeamPage = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <h1>Create Team</h1>
      <p>Team creation is not available in the Open Source edition.</p>
      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  );
};
export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <WizardLayout currentStep={1} maxSteps={3}>
      {children}
    </WizardLayout>
  );
};

export default CreateNewTeamPage;
