import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import { HttpError } from "@calcom/lib/http-error";
import { defaultResponder } from "@calcom/lib/server/defaultResponder";
import prisma from "@calcom/prisma";
import type { Prisma } from "@calcom/prisma/client";
import type { NextApiRequest } from "next";
import { schemaQueryTeamId } from "~/lib/validations/shared/queryTeamId";
import { schemaTeamReadPublic, schemaTeamUpdateBodyParams } from "~/lib/validations/team";

/**
 * @swagger
 * /teams/{teamId}:
 *   patch:
 *     operationId: editTeamById
 *     summary: Edit an existing team
 *     parameters:
 *      - in: path
 *        name: teamId
 *        schema:
 *          type: integer
 *        required: true
 *        description: ID of the team to edit
 *      - in: query
 *        name: apiKey
 *        required: true
 *        schema:
 *          type: string
 *        description: Your API key
 *     requestBody:
 *        description: Create a new custom input for an event type
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  description: Name of the team
 *                slug:
 *                  type: string
 *                  description: A unique slug that works as path for the team public page
 *     tags:
 *     - teams
 *     responses:
 *       201:
 *         description: OK, team edited successfully
 *       400:
 *        description: Bad request. Team body is invalid.
 *       401:
 *        description: Authorization information is missing or invalid.
 */
export async function patchHandler(req: NextApiRequest) {
  const { body, userId } = req;
  const data = schemaTeamUpdateBodyParams.parse(body);
  const { teamId } = schemaQueryTeamId.parse(req.query);

  /** Only OWNERS and ADMINS can edit teams */
  const team = await prisma.team.findFirst({
    // eslint-disable-next-line @calcom/eslint/no-prisma-include-true
    include: { members: true },
    where: { id: teamId, members: { some: { userId, role: { in: ["OWNER", "ADMIN"] } } } },
  });
  if (!team) throw new HttpError({ statusCode: 401, message: "Unauthorized: OWNER or ADMIN required" });

  if (data.slug) {
    const teamRepository = new TeamRepository(prisma);
    const isSlugAvailable = await teamRepository.isSlugAvailableForUpdate({
      slug: data.slug,
      teamId: team.id,
      parentId: team.parentId,
    });
    if (!isSlugAvailable) {
      throw new HttpError({ statusCode: 409, message: "Team slug already exists" });
    }
  }

  // Check if parentId is related to this user
  if (data.parentId && data.parentId === teamId) {
    throw new HttpError({
      statusCode: 400,
      message: "Bad request: Parent id cannot be the same as the team id.",
    });
  }
  if (data.parentId) {
    const parentTeam = await prisma.team.findFirst({
      where: { id: data.parentId, members: { some: { userId, role: { in: ["OWNER", "ADMIN"] } } } },
    });
    if (!parentTeam)
      throw new HttpError({
        statusCode: 401,
        message: "Unauthorized: Invalid parent id. You can only use parent id of your own teams.",
      });
  }

  // OSS: Allow free slug updates without payment
  if (team.slug === null && data.slug) {
    // For OSS deployments, directly set the slug without payment requirement
    // No need to store in metadata or require payment
  }

  // TODO: Perhaps there is a better fix for this?
  const cloneData: typeof data & {
    metadata: NonNullable<typeof data.metadata> | undefined;
    bookingLimits: NonNullable<typeof data.bookingLimits> | undefined;
  } = {
    ...data,
    smsLockReviewedByAdmin: false,
    bookingLimits: data.bookingLimits === null ? {} : data.bookingLimits,
    metadata: data.metadata === null ? {} : data.metadata || undefined,
  };
  const updatedTeam = await prisma.team.update({ where: { id: teamId }, data: cloneData });
  return {
    team: schemaTeamReadPublic.parse(updatedTeam),
  };
}

export default defaultResponder(patchHandler);
