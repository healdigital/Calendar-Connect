import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";

const log = logger.getSubLogger({ prefix: ["hideBranding"] });

// Types stub
type Team = {
  hideBranding: boolean | null;
  parent: {
    hideBranding: boolean | null;
  } | null;
};

type Profile = {
  organization: {
    hideBranding: boolean | null;
  } | null;
};

type UserWithoutProfile = {
  id: number;
  hideBranding: boolean | null;
};

type UserWithProfile = UserWithoutProfile & {
  profile: Profile | null;
};

export async function getHideBranding({
  userId,
  teamId,
}: {
  userId?: number;
  teamId?: number;
}): Promise<boolean> {
  return false;
}

export function shouldHideBrandingForEventUsingProfile({
  eventTypeId,
  owner,
  team,
}: {
  owner: UserWithProfile | null;
  team: Team | null;
  eventTypeId: number;
}) {
  return false;
}

export async function shouldHideBrandingForEvent({
  eventTypeId,
  team,
  owner,
  organizationId,
}: {
  eventTypeId: number;
  team: Team | null;
  owner: UserWithoutProfile | null;
  organizationId: number | null;
}) {
  return false;
}

export function shouldHideBrandingForTeamEvent({ eventTypeId, team }: { eventTypeId: number; team: Team }) {
  return false;
}

export function shouldHideBrandingForUserEvent({
  eventTypeId,
  owner,
}: {
  eventTypeId: number;
  owner: UserWithProfile;
}) {
  return false;
}
