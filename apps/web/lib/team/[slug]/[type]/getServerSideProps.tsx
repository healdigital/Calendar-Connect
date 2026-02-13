import type { GetBookingType } from "@calcom/features/bookings/lib/get-booking";
import type { GetServerSidePropsContext } from "next";

type TeamTypePageSsrProps = {
  slug: string;
  user: string;
  booking?: GetBookingType | null;
  isBrandingHidden: boolean;
  isInstantMeeting: boolean;
  orgBannerUrl: string;
  teamMemberEmail?: string;
  crmOwnerRecordType?: string;
  crmAppSlug?: string;
  crmRecordId?: string;
  isSEOIndexable?: boolean;
  useApiV2?: boolean;
  eventData: {
    length: number;
    title: string;
    hidden: boolean;
    interfaceLanguage: string | null;
    users: Array<{ name: string | null; username: string | null; avatarUrl: string | null }>;
    profile: {
      name: string | null;
      image: string | null;
    };
    metadata?: {
      multipleDuration?: number[];
      [key: string]: unknown;
    };
    eventTypeId: number;
    entity: {
      considerUnpublished: boolean;
      orgSlug?: string | null;
      teamSlug?: string | null;
      [key: string]: unknown;
    };
  };
};

export const getServerSideProps = async (
  _context: GetServerSidePropsContext
): Promise<{ notFound: true } | { props: TeamTypePageSsrProps }> => {
  return {
    notFound: true,
  };
};
