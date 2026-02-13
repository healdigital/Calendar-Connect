import type { GetBookingType } from "@calcom/features/bookings/lib/get-booking";
import type { GetServerSidePropsContext } from "next";

type OrgInstantMeetingTeamTypePageProps = {
  slug: string;
  user: string;
  booking?: GetBookingType | null;
  isBrandingHidden: boolean;
  entity: Record<string, unknown>;
  eventTypeId: number;
  duration: number;
  eventData: Record<string, unknown>;
};

export const getServerSideProps = async (
  _context: GetServerSidePropsContext
): Promise<{ notFound: true } | { props: OrgInstantMeetingTeamTypePageProps }> => {
  return {
    notFound: true,
  };
};
