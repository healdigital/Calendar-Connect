import { WEBAPP_URL } from "@calcom/lib/constants";

export const getTeamUrlSync = ({
  orgSlug,
  teamSlug,
}: {
  orgSlug: string | null;
  teamSlug: string | null;
}) => {
  return WEBAPP_URL;
};
