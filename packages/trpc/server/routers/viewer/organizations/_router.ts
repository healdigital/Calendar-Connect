import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { MembershipRole } from "@calcom/prisma/enums";
import { z } from "zod";

const optionalObjectInput = z.object({}).passthrough().optional();

type OrganizationTeam = {
  id: number;
  name: string;
  slug: string | null;
  bannerUrl: string | null;
  accepted?: boolean;
};

type OrganizationCurrent = {
  id: number;
  slug: string | null;
  name: string | null;
  bannerUrl: string | null;
  canAdminImpersonate: boolean;
  isPrivate: boolean;
  user: {
    role: MembershipRole;
  };
};

type OrganizationMemberAttribute = {
  id?: string;
  attributeId: string;
  value: string;
  slug?: string;
  type?: string;
  weight: number | null;
  contains: string[];
  isGroup?: boolean;
};

type OrganizationMemberRow = {
  id: number;
  name: string | null;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role: MembershipRole;
  customRole:
    | {
        id?: string;
        name: string;
        type?: string;
        description?: string;
        teamId?: number | null;
        createdAt?: Date;
        updatedAt?: Date;
        color?: string | null;
      }
    | null;
  accepted: boolean;
  teams: Array<{ id: number; name: string; slug?: string; accepted?: boolean }>;
  schedules?: Array<{ name: string }>;
  attributes: OrganizationMemberAttribute[];
  bio?: string | null;
  timeZone: string;
  lastActiveAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  completedOnboarding: boolean;
  twoFactorEnabled?: boolean;
  disableImpersonation: boolean;
};

type OrganizationMembersList = {
  rows: OrganizationMemberRow[];
  meta: {
    totalRowCount: number;
  };
};

type OrganizationUser = OrganizationMemberRow;

const emptyOrganizationCurrent: OrganizationCurrent = {
  id: 0,
  slug: null,
  name: null,
  bannerUrl: null,
  canAdminImpersonate: false,
  isPrivate: false,
  user: { role: MembershipRole.MEMBER },
};

const emptyMembersList: OrganizationMembersList = {
  rows: [],
  meta: {
    totalRowCount: 0,
  },
};

const emptyTeams: OrganizationTeam[] = [];
const emptyUser: OrganizationUser = {
  id: 0,
  name: null,
  username: null,
  email: "",
  avatarUrl: null,
  role: MembershipRole.MEMBER,
  customRole: null,
  accepted: false,
  teams: [],
  schedules: [],
  attributes: [],
  bio: null,
  timeZone: "UTC",
  lastActiveAt: null,
  createdAt: null,
  updatedAt: null,
  completedOnboarding: false,
  twoFactorEnabled: false,
  disableImpersonation: false,
};
const emptyObject: Record<string, unknown> = {};
const emptyIntentResult = { checkoutUrl: null as string | null };
const emptyPublishResult = { url: "" };

const queryObject = () =>
  authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<Record<string, unknown>> => emptyObject);
const queryArray = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<OrganizationTeam[]> => emptyTeams);
const mutationObject = () =>
  authedProcedure
    .input(optionalObjectInput)
    .mutation(async (): Promise<Record<string, unknown>> => emptyObject);
const queryBoolean = () => authedProcedure.input(optionalObjectInput).query(async (): Promise<boolean> => false);
const mutationBoolean = () =>
  authedProcedure.input(optionalObjectInput).mutation(async (): Promise<boolean> => false);
const publishMutation = () =>
  authedProcedure.input(optionalObjectInput).mutation(async (): Promise<{ url: string }> => emptyPublishResult);
const intentToCreateOrgMutation = () =>
  authedProcedure
    .input(optionalObjectInput)
    .mutation(async (): Promise<{ checkoutUrl: string | null }> => emptyIntentResult);

const listMembersQuery = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<OrganizationMembersList> => emptyMembersList);

const listCurrentQuery = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<OrganizationCurrent> => emptyOrganizationCurrent);

const getUserQuery = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<OrganizationUser> => emptyUser);

export const viewerOrganizationsRouter = router({
  listMembers: listMembersQuery(),
  listCurrent: listCurrentQuery(),
  getTeams: queryArray(),
  getUser: getUserQuery(),
  checkIfOrgNeedsUpgrade: queryBoolean(),

  intentToCreateOrg: intentToCreateOrgMutation(),
  createPhoneCall: mutationObject(),
  verifyCode: mutationBoolean(),
  addMembersToEventTypes: mutationObject(),
  removeHostsFromEventTypes: mutationObject(),
  addMembersToTeams: mutationObject(),
  bulkDeleteUsers: mutationObject(),
  updateUser: mutationObject(),
  publish: publishMutation(),
  sendPasswordReset: mutationObject(),
});
