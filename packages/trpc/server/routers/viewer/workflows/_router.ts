import { z } from "zod";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const optionalObjectInput = z.object({}).passthrough().optional();

export const workflowsRouter = router({
  getAllActiveWorkflows: authedProcedure
    .input(optionalObjectInput)
    .query(async (): Promise<Array<Record<string, unknown>>> => []),
  getVerifiedEmails: authedProcedure.input(optionalObjectInput).query(async (): Promise<string[]> => []),
});
