export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <WizardLayout currentStep={2} maxSteps={3}>
    {children}
  </WizardLayout>
);

export default function AddNewTeamMembers() {
  return <div>Team onboarding is an Enterprise feature.</div>;
}
