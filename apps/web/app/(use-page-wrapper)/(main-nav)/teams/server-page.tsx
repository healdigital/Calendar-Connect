import { TeamsCTA } from "./CTA";

export const ServerTeamsListing = async ({ searchParams, session }: { searchParams: any; session: any }) => {
  return {
    Main: (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed rounded-lg border-subtle">
        <h2 className="text-xl font-semibold mb-2">Teams features are not available</h2>
        <p className="text-subtle text-center max-w-md">
          This is an open-source version of Cal.com. Teams and Organizations features are not included in this build.
        </p>
      </div>
    ),
    CTA: <TeamsCTA />,
  };
};
