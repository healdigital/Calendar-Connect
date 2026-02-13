import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { z } from "zod";

const optionalObjectInput = z.object({}).passthrough().optional();

export const workflowsRouter = router({
  getAllActiveWorkflows: authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<Array<Record<string, unknown>>> => []),
  getVerifiedEmails: authedProcedure.input(optionalObjectInput).query(async (): Promise<string[]> => []),
});
