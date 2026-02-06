import process from "node:process";
import { AnalyticsRepository } from "@calcom/features/thotis/repositories/AnalyticsRepository";
import { ProfileRepository } from "@calcom/features/thotis/repositories/ProfileRepository";
import { SessionRatingRepository } from "@calcom/features/thotis/repositories/SessionRatingRepository";
import { ProfileService } from "@calcom/features/thotis/services/ProfileService";
import { StatisticsService } from "@calcom/features/thotis/services/StatisticsService";
import { ThotisAdminService } from "@calcom/features/thotis/services/ThotisAdminService";
import { ThotisAnalyticsService } from "@calcom/features/thotis/services/ThotisAnalyticsService";
import { ThotisBookingService } from "@calcom/features/thotis/services/ThotisBookingService";
import { ThotisEmailService } from "@calcom/features/thotis/services/ThotisEmailService";
import { ThotisGuestService } from "@calcom/features/thotis/services/ThotisGuestService";
import prisma from "@calcom/prisma";
import {
  AcademicField,
  MentorIncidentType,
  MentorModerationActionType,
  MentorStatus,
  ThotisAnalyticsEventType,
} from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import authedProcedure, { authedAdminProcedure } from "../procedures/authedProcedure";
import publicProcedure from "../procedures/publicProcedure";
import { router } from "../trpc";

const profileRepository = new ProfileRepository();
const ratingRepository = new SessionRatingRepository();
const analyticsRepository = new AnalyticsRepository();
const analyticsService = new ThotisAnalyticsService(analyticsRepository);
const profileService = new ProfileService(profileRepository);
const bookingService = new ThotisBookingService(prisma, undefined, undefined, analyticsService);
const statisticsService = new StatisticsService(profileRepository, ratingRepository, analyticsService);
const adminService = new ThotisAdminService(profileService, profileRepository);
const guestService = new ThotisGuestService();
const emailService = new ThotisEmailService();
const analyticsRouter = router({
  track: publicProcedure
    .input(
      z.object({
        eventType: z.nativeEnum(ThotisAnalyticsEventType),
        profileId: z.string().optional(),
        bookingId: z.number().optional(),
        field: z.string().optional(),
        source: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await analyticsService.track({
        ...input,
        userId: ctx.user?.id,
      });
    }),
});
const incidentRouter = router({
  report: authedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        type: z.nativeEnum(MentorIncidentType),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create quality incident
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: {
          uid: true,
          metadata: true,
        },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      const metadata = booking.metadata as { studentProfileId?: string } | null;
      if (!metadata?.studentProfileId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not a valid mentor session" });
      }

      if (input.type === MentorIncidentType.NO_SHOW) {
        // Create the incident first. The lifecycle cron will pick this up and mark the session as NO_SHOW.
        // We do NOT cancel immediately here to ensure single source of truth in lifecycle.
        await prisma.mentorQualityIncident.create({
          data: {
            studentProfileId: metadata.studentProfileId,
            bookingUid: booking.uid,
            reportedByUserId: ctx.user.id,
            type: input.type,
            description: input.description || "",
          },
        });
      } else {
        await prisma.mentorQualityIncident.create({
          data: {
            studentProfileId: metadata.studentProfileId,
            bookingUid: booking.uid,
            reportedByUserId: ctx.user.id,
            type: input.type,
            description: input.description || "",
          },
        });
      }

      return { success: true };
    }),
});

const guestRouter = router({
  requestInboxLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { token } = await guestService.requestInboxLink(input.email);
      const link = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/thotis/my-sessions?token=${token}`;
      await emailService.sendMagicLink(input.email, link, "LOGIN");
      return { success: true };
    }),

  getSessionsByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        status: z.enum(["upcoming", "past", "cancelled", "all"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return await bookingService.studentSessions(input);
    }),

  cancelByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        bookingId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const magicLink = await guestService.verifyToken(input.token);
      if (magicLink.bookingId && magicLink.bookingId !== input.bookingId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token not valid for this booking" });
      }
      const requester = { id: 0, email: magicLink.guest.email, name: "Guest Student" };

      // Verify ownership? bookingService.cancelSession checks if requester is owner/host
      // We need to ensure bookingService handles id=0 or check it here.
      // ThotisBookingService logic: checks `booking.userId === requester.id` (Mentor) OR `responses.email === requester.email` (Student)
      // So passing correct email is key.

      const result = await bookingService.cancelSession(input.bookingId, input.reason, "student", requester);
      // Only invalidate if the token was scoped to a specific booking (one-time action)
      if (magicLink.bookingId) {
        await guestService.invalidateToken(magicLink.id);
      }
      await guestService.logAccess(
        magicLink.guestId,
        "cancelByToken",
        "CANCEL",
        String(input.bookingId),
        true
      );

      return result;
    }),

  rescheduleByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        bookingId: z.number(),
        newDateTime: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const magicLink = await guestService.verifyToken(input.token);
      if (magicLink.bookingId && magicLink.bookingId !== input.bookingId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token not valid for this booking" });
      }
      const requester = { id: 0, email: magicLink.guest.email, name: "Guest Student" };

      const result = await bookingService.rescheduleSession(input.bookingId, input.newDateTime, requester);
      // Only invalidate if the token was scoped to a specific booking (one-time action)
      if (magicLink.bookingId) {
        await guestService.invalidateToken(magicLink.id);
      }
      await guestService.logAccess(
        magicLink.guestId,
        "rescheduleByToken",
        "RESCHEDULE",
        String(input.bookingId),
        true
      );

      return result;
    }),

  rateByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        bookingId: z.number(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const magicLink = await guestService.verifyToken(input.token);
      if (magicLink.bookingId && magicLink.bookingId !== input.bookingId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token not valid for this booking" });
      }
      const email = magicLink.guest.email;

      // Same logic as rating.submit but with verified email from token
      // We can reuse the service logic or call internal helper

      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: {
          id: true,
          status: true,
          startTime: true,
          endTime: true,
          metadata: true,
          responses: true,
          userId: true,
        },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      const responses = booking.responses as { email?: string } | null;
      if (responses?.email !== email) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Email does not match booking" });
      }

      // ... validations copied from submit ...
      const now = new Date();
      if (booking.endTime > now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot rate a session that hasn't ended yet" });
      }
      if (booking.status !== "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only completed sessions can be rated" });
      }

      // Check if already rated
      const existingRating = await prisma.sessionRating.findUnique({
        where: { bookingId: input.bookingId },
        select: { id: true },
      });
      if (existingRating) {
        throw new TRPCError({ code: "CONFLICT", message: "Session has already been rated" });
      }

      const metadata = booking.metadata as { studentProfileId?: string } | null;
      const studentProfileId = metadata?.studentProfileId;
      if (!studentProfileId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid Thotis booking" });
      }
      if (!booking.userId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Booking has no mentor assigned" });
      }

      await statisticsService.addRating(
        input.bookingId,
        booking.userId,
        input.rating,
        input.feedback || null,
        email
      );

      // Track Postgres Analytics
      await analyticsService.track({
        eventType: ThotisAnalyticsEventType.rating_submitted,
        userId: booking.userId,
        profileId: studentProfileId,
        bookingId: input.bookingId,
        metadata: {
          rating: input.rating,
          hasFeedback: !!input.feedback,
        },
      });

      await guestService.invalidateToken(magicLink.id);
      await guestService.logAccess(magicLink.guestId, "rateByToken", "RATE", String(input.bookingId), true);
      return { success: true };
    }),

  getRatingByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        bookingId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const magicLink = await guestService.verifyToken(input.token);
      if (magicLink.bookingId && magicLink.bookingId !== input.bookingId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token not valid for this booking" });
      }
      const email = magicLink.guest.email;

      const rating = await prisma.sessionRating.findUnique({
        where: { bookingId: input.bookingId },
        select: {
          id: true,
          rating: true,
          feedback: true,
          createdAt: true,
        },
      });

      if (rating) {
        // Verify it's their rating (via booking responses)
        const booking = await prisma.booking.findUnique({
          where: { id: input.bookingId },
          select: { responses: true },
        });
        const responses = booking?.responses as { email?: string } | null;
        if (responses?.email !== email) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
      }

      return rating;
    }),

  reportByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        bookingId: z.number(),
        type: z.nativeEnum(MentorIncidentType),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const magicLink = await guestService.verifyToken(input.token);
      if (magicLink.bookingId && magicLink.bookingId !== input.bookingId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token not valid for this booking" });
      }
      const email = magicLink.guest.email;

      // Verify booking exists and matches email
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: {
          uid: true,
          metadata: true,
          responses: true,
        },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      const responses = booking.responses as { email?: string } | null;
      if (responses?.email !== email) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Email does not match booking" });
      }

      const metadata = booking.metadata as { studentProfileId?: string } | null;
      if (!metadata?.studentProfileId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not a valid mentor session" });
      }

      if (input.type === MentorIncidentType.NO_SHOW) {
        // Create the incident first. The lifecycle cron will pick this up and mark the session as NO_SHOW.
        await prisma.mentorQualityIncident.create({
          data: {
            studentProfileId: metadata.studentProfileId,
            bookingUid: booking.uid,
            reportedByUserId: null, // Guest report
            type: input.type,
            description: "No-show reported by guest",
          },
        });
      } else {
        await prisma.mentorQualityIncident.create({
          data: {
            studentProfileId: metadata.studentProfileId,
            bookingUid: booking.uid,
            reportedByUserId: null, // Guest report
            type: input.type,
            description: input.description || "",
          },
        });
      }

      // Track Postgres Analytics
      await analyticsService.track({
        eventType:
          input.type === MentorIncidentType.NO_SHOW
            ? ThotisAnalyticsEventType.no_show
            : ThotisAnalyticsEventType.profile_viewed, // Fallback for other incidents for now, or use a custom property
        userId: undefined,
        profileId: metadata.studentProfileId,
        bookingId: input.bookingId,
        metadata: {
          incidentType: input.type,
          isGuestReport: true,
          description: input.description,
        },
      });

      await guestService.invalidateToken(magicLink.id);
      await guestService.logAccess(
        magicLink.guestId,
        "reportByToken",
        "REPORT",
        String(input.bookingId),
        true
      );

      return { success: true };
    }),

  getPostSessionDataByToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        bookingId: z.number(),
      })
    )
    .query(async ({ input }) => {
      // Verify token
      const magicLink = await guestService.verifyToken(input.token);

      // Enforce booking-specific scope (anti-abuse and data leakage prevention)
      // Tokens created for specific bookings (e.g. from reminder emails) must match the requested bookingId.
      if (magicLink.bookingId && magicLink.bookingId !== input.bookingId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Token not valid for this booking" });
      }

      // STRICT SCOPE: For accessing post-session data, we REQUIRE that the token be scoped to this booking
      // or at least we verify the guest strictly owns it.
      // If the token is a generic "dashboard" token (bookingId is null), we must be extra careful.
      // Requirement: "Endpoint tokenisé getPostSessionDataByToken sans check strict du bookingId scope comme les autres endpoints token."
      // We enforce strict scope if the token was created with a bookingId.
      // Even if generic, we enforce specific booking ownership via email match.

      const email = magicLink.guest.email;

      // Verify booking matches email
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: { responses: true },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      const responses = booking.responses as { email?: string } | null;
      if (responses?.email !== email) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized: Email does not match booking" });
      }

      const summary = await prisma.thotisSessionSummary.findUnique({
        where: { bookingId: input.bookingId },
      });
      const resources = await prisma.thotisSessionResource.findMany({
        where: { bookingId: input.bookingId },
      });

      return { summary, resources };
    }),
});

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
      // Check if profile already exists
      const existing = await profileService.getProfile(ctx.user.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Profile already exists" });
      }

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
        expertise: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await profileService.updateProfile(ctx.user.id, input);
    }),

  get: authedProcedure.query(async ({ ctx }) => {
    return await profileService.getProfile(ctx.user.id);
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        university: z.string().optional(),
        minRating: z.number().optional(),
        isActive: z.boolean().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
        expertise: z.array(z.string()).optional(),
        sort: z.enum(["rating", "popularity", "newest"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return await profileService.searchProfiles(input);
    }),

  getTopMentors: publicProcedure.query(async () => {
    return await profileService.getTopRatedProfiles();
  }),

  // Personalized recommendations for logged-in students
  getRecommended: authedProcedure.query(async ({ ctx }) => {
    // 1. Try to find the user's student profile (intention/profile)
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { field: true },
    });

    // 2. Fetch recommendations based on their field, if it exists
    return await profileService.getRecommendedProfiles(studentProfile?.field);
  }),

  getByUsername: publicProcedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
    return await profileService.getProfileByUsername(input.username);
  }),

  /** Get distinct universities from active profiles for filter dropdowns */
  universities: publicProcedure.query(async () => {
    const results = await prisma.studentProfile.findMany({
      where: { isActive: true },
      select: { university: true },
      distinct: ["university"],
      orderBy: { university: "asc" },
    });
    return results.map((r) => r.university).filter(Boolean);
  }),
});

const bookingRouter = router({
  createSession: publicProcedure
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

  getAvailability: publicProcedure
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
    .mutation(async ({ ctx, input }) => {
      const requester = { id: ctx.user.id, email: ctx.user.email };

      return await bookingService.cancelSession(input.bookingId, input.reason, input.cancelledBy, requester);
    }),

  rescheduleSession: authedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        newDateTime: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requester = { id: ctx.user.id, email: ctx.user.email };

      return await bookingService.rescheduleSession(input.bookingId, input.newDateTime, requester);
    }),

  markComplete: authedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await bookingService.markSessionComplete(input.bookingId, {
        id: ctx.user.id,
        email: ctx.user.email,
      });
    }),

  submitPostSessionData: authedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        content: z.string(),
        nextSteps: z.string().optional(),
        resources: z.array(
          z.object({
            type: z.string(),
            title: z.string(),
            url: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership (Mentor)
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: { userId: true, status: true, endTime: true, metadata: true },
      });

      if (!booking || booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to edit this session" });
      }

      // 2. Verify session is finished
      const now = new Date();
      if (booking.endTime > now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot submit post-session data for a session that hasn't ended yet",
        });
      }

      if (booking.status !== "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only completed sessions can have post-session data",
        });
      }

      const metadata = booking.metadata as { completedAt?: string } | null;
      if (!metadata?.completedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session must be marked as complete before adding a summary",
        });
      }

      // 3. Upsert Summary
      await prisma.thotisSessionSummary.upsert({
        where: { bookingId: input.bookingId },
        create: {
          bookingId: input.bookingId,
          content: input.content,
          nextSteps: input.nextSteps,
        },
        update: {
          content: input.content,
          nextSteps: input.nextSteps,
        },
      });

      // 3. Replace Resources
      // Transaction to delete old and create new
      await prisma.$transaction([
        prisma.thotisSessionResource.deleteMany({
          where: { bookingId: input.bookingId },
        }),
        prisma.thotisSessionResource.createMany({
          data: input.resources.map((r) => ({
            bookingId: input.bookingId,
            type: r.type,
            title: r.title,
            url: r.url,
          })),
        }),
      ]);

      return { success: true };
    }),

  getPostSessionData: authedProcedure
    .input(z.object({ bookingId: z.number() }))
    // Force rebuild type
    .query(async ({ ctx, input }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: { userId: true, responses: true },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Allow Mentor (owner) or Student (email match)
      const isMentor = booking.userId === ctx.user.id;
      const responses = booking.responses as { email?: string } | null;
      const isStudent = responses?.email === ctx.user.email;

      if (!isMentor && !isStudent) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this session" });
      }

      const summary = await prisma.thotisSessionSummary.findUnique({
        where: { bookingId: input.bookingId },
      });
      const resources = await prisma.thotisSessionResource.findMany({
        where: { bookingId: input.bookingId },
      });

      return { summary, resources };
    }),

  /** Get sessions for the authenticated mentor */
  mentorSessions: authedProcedure
    .input(
      z.object({
        status: z.enum(["upcoming", "past", "cancelled"]).optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const now = new Date();

      const baseWhere = {
        userId: ctx.user.id,
        eventType: {
          metadata: {
            path: ["isThotisSession"],
            equals: true,
          },
        },
      };

      let statusFilter = {};
      if (input.status === "upcoming") {
        statusFilter = {
          startTime: { gte: now },
          status: { in: ["ACCEPTED", "PENDING"] },
        };
      } else if (input.status === "past") {
        statusFilter = {
          endTime: { lt: now },
          status: { in: ["ACCEPTED", "PENDING"] },
        };
      } else if (input.status === "cancelled") {
        statusFilter = { status: "CANCELLED" };
      }

      const where = { ...baseWhere, ...statusFilter };

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          select: {
            id: true,
            uid: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            metadata: true,
            responses: true,
            cancellationReason: true,
            thotisSessionSummary: {
              select: { id: true },
            },
          },
          orderBy: { startTime: input.status === "upcoming" ? "asc" : "desc" },
          skip,
          take: pageSize,
        }),
        prisma.booking.count({ where }),
      ]);

      return { bookings, total, page, pageSize };
    }),

  /** Get sessions for the authenticated student via email */
  studentSessions: publicProcedure
    .input(
      z.object({
        status: z.enum(["upcoming", "past", "cancelled", "all"]).optional(),
        token: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await bookingService.studentSessions({ ...input, userId: ctx.user?.id, email: ctx.user?.email });
    }),
});

const ratingRouter = router({
  /** Submit a rating for a completed session - NOW AUTHENTICATED OR REPLACED BY RATE_BY_TOKEN */
  submit: authedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Allow only if the logged-in email matches the input email
      if (ctx.user.email !== input.email) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only submit ratings for yourself" });
      }

      // Verify the booking exists and is a Thotis session
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: {
          id: true,
          status: true,
          startTime: true,
          endTime: true,
          metadata: true,
          responses: true,
          userId: true, // Fetch the mentor's user ID
        },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Verify the email matches the prospective student
      const responses = booking.responses as { email?: string } | null;
      if (responses?.email !== input.email) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Email does not match booking" });
      }

      // Verify the session has ended and is marked as complete
      const now = new Date();
      if (booking.endTime > now) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot rate a session that hasn't ended yet" });
      }

      if (booking.status !== "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only completed sessions can be rated" });
      }

      // Check if already rated
      const existingRating = await prisma.sessionRating.findUnique({
        where: { bookingId: input.bookingId },
        select: { id: true },
      });

      if (existingRating) {
        throw new TRPCError({ code: "CONFLICT", message: "Session has already been rated" });
      }

      const metadata = booking.metadata as { studentProfileId?: string; completedAt?: string } | null;
      const studentProfileId = metadata?.studentProfileId;

      if (!studentProfileId || !metadata?.completedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only completed Thotis sessions can be rated",
        });
      }

      if (!booking.userId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Booking has no mentor assigned" });
      }

      // addRating handles both creating the SessionRating record AND updating mentor statistics
      await statisticsService.addRating(
        input.bookingId,
        booking.userId,
        input.rating,
        input.feedback || null,
        input.email
      );

      // Track Postgres Analytics
      await analyticsService.track({
        eventType: ThotisAnalyticsEventType.rating_submitted,
        userId: booking.userId,
        profileId: studentProfileId,
        bookingId: input.bookingId,
        metadata: {
          rating: input.rating,
          hasFeedback: !!input.feedback,
        },
      });

      return { success: true };
    }),

  /** Get rating for a specific booking */
  getByBooking: authedProcedure.input(z.object({ bookingId: z.number() })).query(async ({ ctx, input }) => {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { userId: true, responses: true },
    });

    if (!booking) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
    }

    // Allow Mentor (owner) or Student (email match)
    const isMentor = booking.userId === ctx.user.id;
    const responses = booking.responses as { email?: string } | null;
    const isStudent = responses?.email === ctx.user.email;

    if (!isMentor && !isStudent) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this rating" });
    }

    const rating = await prisma.sessionRating.findUnique({
      where: { bookingId: input.bookingId },
      select: {
        id: true,
        rating: true,
        feedback: true,
        createdAt: true,
      },
    });
    return rating;
  }),
});

const statisticsRouter = router({
  studentStats: authedProcedure
    .input(
      z.object({
        studentId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Allow if user is admin OR requesting their own stats
      if (ctx.user.role !== "ADMIN" && ctx.user.id !== input.studentId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view these statistics",
        });
      }
      return await statisticsService.getStudentStats(input.studentId);
    }),

  platformStats: authedAdminProcedure
    .input(
      z
        .object({
          period: z.enum(["daily", "weekly", "monthly"]).optional(),
          field: z.string().optional(),
          profileId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await statisticsService.getPlatformStats(input?.period, input?.field, input?.profileId);
    }),
});

const adminRouter = router({
  listAmbassadors: authedAdminProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        fieldOfStudy: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return await adminService.listAllAmbassadors(input);
    }),

  createAmbassador: authedAdminProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        fieldOfStudy: z.nativeEnum(AcademicField),
        university: z.string(),
        degree: z.string(),
        yearOfStudy: z.number(),
        bio: z.string(),
        expertise: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await adminService.provisionAmbassador(input);
    }),

  updateStatus: authedAdminProcedure
    .input(
      z.object({
        profileId: z.string(),
        status: z.nativeEnum(MentorStatus),
      })
    )
    .mutation(async ({ input }) => {
      return await adminService.setAmbassadorStatus(input.profileId, input.status);
    }),

  sendPasswordReset: authedAdminProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await adminService.sendInitialPasswordSetup(input.userId);
    }),

  listIncidents: authedAdminProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        studentProfileId: z.string().optional(),
        type: z.nativeEnum(MentorIncidentType).optional(),
        resolved: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return await adminService.listIncidents(input);
    }),

  resolveIncident: authedAdminProcedure
    .input(
      z.object({
        incidentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await adminService.resolveIncident(input.incidentId);
    }),

  takeModerationAction: authedAdminProcedure
    .input(
      z.object({
        studentProfileId: z.string(),
        actionType: z.nativeEnum(MentorModerationActionType),
        reason: z.string().optional(),
        updateStatusTo: z.nativeEnum(MentorStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await adminService.takeModerationAction({
        ...input,
        actionByUserId: ctx.user.id,
      });
    }),
});

const intentRouter = router({
  upsert: authedProcedure
    .input(
      z.object({
        targetFields: z.array(z.string()),
        academicLevel: z.string(),
        zone: z.string().optional().nullable(),
        goals: z.array(z.string()).optional(),
        scheduleConstraints: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await profileService.upsertOrientationIntent(ctx.user.id, input);
    }),

  get: authedProcedure.query(async ({ ctx }) => {
    return await prisma.thotisOrientationIntent.findFirst({
      where: { userId: ctx.user.id },
    });
  }),

  getRecommended: publicProcedure
    .input(
      z.object({
        targetFields: z.array(z.string()),
        academicLevel: z.string(),
        zone: z.string().optional().nullable(),
        goals: z.array(z.string()).optional(),
        scheduleConstraints: z.any().optional(),
      })
    )
    .query(async ({ input }) => {
      return await profileService.getRecommendedProfilesByIntent(input);
    }),
});

export const thotisRouter = router({
  profile: profileRouter,
  booking: bookingRouter,
  rating: ratingRouter,
  statistics: statisticsRouter,
  admin: adminRouter,
  guest: guestRouter,
  incident: incidentRouter,
  analytics: analyticsRouter,
  intent: intentRouter,
});
