import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { z } from "zod";

const optionalObjectInput = z.object({}).passthrough().optional();

export const paymentsRouter = router({
  chargeCard: authedProcedure
    .input(optionalObjectInput)
    .mutation(async (): Promise<{ success: boolean }> => ({ success: true })),
});
