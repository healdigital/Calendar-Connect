import { MembershipRole } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import { TRPCError } from "@trpc/server";
import type { TGetAllCreditsSchema } from "./getAllCredits.schema";

// Local stubs to break circular dependency with platform-libraries
class TeamService {
  static async fetchTeamOrThrow(_teamId: number) {
    return { isOrganization: false };
  }
}

class PermissionCheckService {
  async checkPermission(_args: any) {
    return false;
  }
}

type GetAllCreditsOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TGetAllCreditsSchema;
};

export const getAllCreditsHandler = async ({ ctx, input }: GetAllCreditsOptions) => {
  const { teamId } = input;

  if (teamId) {
    const team = await TeamService.fetchTeamOrThrow(teamId);

    const permissionService = new PermissionCheckService();
    const hasManageBillingPermission = await permissionService.checkPermission({
      userId: ctx.user.id,
      teamId,
      permission: team.isOrganization ? "organization.manageBilling" : "team.manageBilling",
      fallbackRoles: [MembershipRole.ADMIN, MembershipRole.OWNER],
    });

    if (!hasManageBillingPermission) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
      });
    }
  }

  const credits: any[] = [];
  return { credits };
};
