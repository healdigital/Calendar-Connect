import type { GetServerSidePropsContext } from "next";

type TeamPageSsrProps = {
  team: {
    name: string;
    slug: string;
    metadata: Record<string, unknown>;
    safeBio: string;
    bio: string | null;
    theme: string | null;
    logoUrl: string | null;
    isPrivate: boolean;
    isOrganization: boolean;
    hideBookATeamMember: boolean;
    parent?:
      | {
          logoUrl: string | null;
          name: string | null;
          slug: string | null;
          requestedSlug?: string | null;
          isOrganization: boolean;
          isPrivate: boolean;
        }
      | null;
    members: Array<{
      id: number;
      name: string | null;
      username: string | null;
      bio: string | null;
      avatarUrl: string | null;
      organizationId: number | null;
      profile: unknown;
      subteams: string[] | null;
      accepted: boolean;
    }>;
    children: Array<{ slug: string; name: string | null }>;
    eventTypes:
      | Array<{
          slug: string;
          title: string;
          description: string | null;
          users: Array<{
            name: string | null;
            username: string | null;
            avatarUrl: string | null;
          }>;
        }>
      | null;
  };
  considerUnpublished?: boolean;
  isValidOrgDomain?: boolean;
  currentOrgDomain?: string | null;
  markdownStrippedBio?: string;
  isSEOIndexable?: boolean;
};

export const getServerSideProps = async (
  _context: GetServerSidePropsContext
): Promise<{ notFound: true } | { props: TeamPageSsrProps }> => {
  return {
    notFound: true,
  };
};
