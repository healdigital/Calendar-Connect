import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { z } from "zod";

const optionalObjectInput = z.object({}).passthrough().optional();

type Team = {
  id: number;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  isOrganization?: boolean;
};

type TeamMember = {
  id: number;
  teamId: number;
  name: string | null;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  status: "available" | "unavailable";
  role: "OWNER" | "ADMIN" | "MEMBER";
};

type TeamListMembers = {
  members: TeamMember[];
  nextCursor: number | null;
};

type ReassignCandidate = {
  id: number;
  name: string | null;
  email: string;
  status: "available" | "unavailable";
};

type ReassignList = {
  items: ReassignCandidate[];
  nextCursor: number | null;
};

type Invoice = {
  id: string;
  created: number;
  number: string | null;
  hostedInvoiceUrl: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string | null;
  description: string | null;
  lineItems: Array<{ description: string | null }>;
  invoicePdf: string | null;
};

type TeamListInvoices = {
  invoices: Invoice[];
  nextCursor: string | null;
  hasMore: boolean;
};

const emptyArray: Team[] = [];
const emptyObject: Record<string, unknown> = {};
const emptyMembers: TeamListMembers = { members: [], nextCursor: null };
const emptyReassignList: ReassignList = { items: [], nextCursor: null };
const emptyInvoices: TeamListInvoices = { invoices: [], nextCursor: null, hasMore: false };
const emptyTeam = { id: 0, slug: null as string | null, name: null as string | null };

const queryObject = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<Record<string, unknown>> => emptyObject);
const queryTeamArray = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<Team[]> => emptyArray);
const queryMembers = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<TeamListMembers> => emptyMembers);
const queryReassignList = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<ReassignList> => emptyReassignList);
const queryInvoices = () =>
  authedProcedure.input(optionalObjectInput).query(async (): Promise<TeamListInvoices> => emptyInvoices);
const queryTeam = () =>
  authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<{ id: number; slug: string | null; name: string | null }> => emptyTeam);
const querySubscriptionStatus = () =>
  authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<{ isTrialing: boolean }> => ({ isTrialing: false }));
const queryHasTeamPlan = () =>
  authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<{ hasTeamPlan: boolean; plan: string | null }> => ({
      hasTeamPlan: false,
      plan: null,
    }));
const queryHasTeamMembership = () =>
  authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<{ hasTeamMembership: boolean }> => ({ hasTeamMembership: false }));
const queryHasActiveTeamPlan = () =>
  authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<{ isActive: boolean; isTrial: boolean }> => ({
      isActive: false,
      isTrial: false,
    }));
const queryHasEditPermissionForUser = () =>
  authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<{ isAllowed: boolean }> => ({ isAllowed: false }));
const mutationObject = () =>
  authedProcedure.input(optionalObjectInput).mutation(async (): Promise<Record<string, unknown>> => emptyObject);
const mutationCreateTeam = () =>
  authedProcedure
    .input(optionalObjectInput)
    .mutation(async (): Promise<{ url: string | null; team: { id: number } | null }> => ({
      url: null,
      team: { id: 0 },
    }));
const mutationRoundRobinReassign = () =>
  authedProcedure
    .input(optionalObjectInput)
    .mutation(async (): Promise<{ reassignedTo: { name: string | null } }> => ({
      reassignedTo: { name: null },
    }));

export const viewerTeamsRouter = router({
  list: queryTeamArray(),
  listOwnedTeams: queryTeamArray(),
  listMembers: queryMembers(),
  listSimpleMembers: queryTeamArray(),
  legacyListMembers: queryMembers(),
  listInvites: queryTeamArray(),
  listInvoices: queryInvoices(),
  getUpgradeable: queryTeamArray(),
  getManagedEventUsersToReassign: queryReassignList(),
  getRoundRobinHostsToReassign: queryReassignList(),

  get: queryTeam(),
  hasTeamPlan: queryHasTeamPlan(),
  hasTeamMembership: queryHasTeamMembership(),
  hasActiveTeamPlan: queryHasActiveTeamPlan(),
  hasEditPermissionForUser: queryHasEditPermissionForUser(),
  getSubscriptionStatus: querySubscriptionStatus(),

  create: mutationCreateTeam(),
  inviteMember: mutationObject(),
  removeMember: mutationObject(),
  resendInvitation: mutationObject(),
  skipTeamTrials: mutationObject(),
  skipTrialForTeam: mutationObject(),
  roundRobinReassign: mutationRoundRobinReassign(),
  managedEventReassign: mutationObject(),
  roundRobinManualReassign: mutationObject(),
  managedEventManualReassign: mutationObject(),
});
