import { z } from "zod";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const optionalObjectInput = z.object({}).passthrough().optional();

export const paymentsRouter = router({
  chargeCard: authedProcedure
    .input(optionalObjectInput)
    .mutation(async (): Promise<{ success: boolean }> => ({ success: true })),
});
