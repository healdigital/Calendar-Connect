import { ProfileRepository } from "@calcom/features/thotis/repositories/ProfileRepository";
import { SessionRatingRepository } from "@calcom/features/thotis/repositories/SessionRatingRepository";
import { ProfileService } from "@calcom/features/thotis/services/ProfileService";
import { StatisticsService } from "@calcom/features/thotis/services/StatisticsService";
import { ThotisBookingService } from "@calcom/features/thotis/services/ThotisBookingService";
import prisma from "@calcom/prisma";
import { z } from "zod";
import authedProcedure from "../procedures/authedProcedure";
import { router } from "../trpc";

const profileRepository = new ProfileRepository();
const ratingRepository = new SessionRatingRepository();
const profileService = new ProfileService(profileRepository);
const bookingService = new ThotisBookingService(prisma);
const statisticsService = new StatisticsService(profileRepository, ratingRepository);

const profileRouter = router({
  create: authedProcedure
    .input(
      z.object({
        fieldOfStudy: z.string(),
        yearOfStudy: z.number(),
        bio: z.string(),
        university: z.string(),
        degree: z.string(),
        profilePhotoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await profileService.createProfile({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: authedProcedure
    .input(
      z.object({
        fieldOfStudy: z.string().optional(),
        yearOfStudy: z.number().optional(),
        bio: z.string().optional(),
        university: z.string().optional(),
        degree: z.string().optional(),
        profilePhotoUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await profileService.updateProfile(ctx.user.id, input);
    }),

  get: authedProcedure.query(async ({ ctx }) => {
    return await profileService.getProfile(ctx.user.id);
  }),

  // Public search doesn't strictly need auth, but requirements mentioned auth middleware.
  // We can make it authed for now as it's an internal API.
  search: authedProcedure
    .input(
      z.object({
        fieldOfStudy: z.string().optional(),
        university: z.string().optional(),
        minRating: z.number().optional(),
        isActive: z.boolean().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await profileService.searchProfiles(input);
    }),
});

const bookingRouter = router({
  createSession: authedProcedure
    .input(
      z.object({
        studentProfileId: z.string(),
        dateTime: z.date(),
        prospectiveStudent: z.object({
          name: z.string(),
          email: z.string().email(),
          question: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return await bookingService.createStudentSession(input);
    }),

  getAvailability: authedProcedure
    .input(
      z.object({
        studentProfileId: z.string(),
        start: z.date(),
        end: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await bookingService.getStudentAvailability(input.studentProfileId, {
        start: input.start,
        end: input.end,
      });
    }),

  cancelSession: authedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        reason: z.string(),
        cancelledBy: z.enum(["mentor", "student"]),
      })
    )
    .mutation(async ({ input }) => {
      return await bookingService.cancelSession(input.bookingId, input.reason, input.cancelledBy);
    }),

  rescheduleSession: authedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        newDateTime: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      return await bookingService.rescheduleSession(input.bookingId, input.newDateTime);
    }),
});

const statisticsRouter = router({
  studentStats: authedProcedure
    .input(
      z.object({
        studentId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await statisticsService.getStudentStats(input.studentId);
    }),

  platformStats: authedProcedure.query(async () => {
    return await statisticsService.getPlatformStats();
  }),
});

export const thotisRouter = router({
  profile: profileRouter,
  booking: bookingRouter,
  statistics: statisticsRouter,
});
