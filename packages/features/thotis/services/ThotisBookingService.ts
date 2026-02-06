import process from "node:process";
import BookingCancellationEmail from "@calcom/emails/templates/thotis/booking-cancellation";
import BookingConfirmationEmail from "@calcom/emails/templates/thotis/booking-confirmation";
import BookingRescheduledEmail from "@calcom/emails/templates/thotis/booking-rescheduled";
import { createEvent, deleteEvent, updateEvent } from "@calcom/features/calendars/lib/CalendarManager";
import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import { TimeFormat } from "@calcom/lib/timeFormat";
import type { Prisma, PrismaClient } from "@calcom/prisma/client";
import { MentorIncidentType, MentorStatus, ThotisAnalyticsEventType } from "@calcom/prisma/enums";
import type { CalendarEvent, Person } from "@calcom/types/Calendar";
import type { CredentialForCalendarService } from "@calcom/types/Credential";
import type { TFunction } from "next-i18next";
import { uuid } from "short-uuid";
import type { ContextForGetSchedule } from "../../../trpc/server/routers/viewer/slots/types";
import { RedisService } from "../../redis/RedisService";
import { AnalyticsService } from "./AnalyticsService";
import type { ThotisAnalyticsService } from "./ThotisAnalyticsService";

/**
 * Service for managing Thotis student mentoring session bookings
 * Implements business logic for 15-minute sessions with validation
 */
export class ThotisBookingService {
  private analytics: AnalyticsService;
  private thotisAnalytics: ThotisAnalyticsService | null = null;
  private redis?: RedisService;

  constructor(
    private readonly prisma: Prisma.TransactionClient | PrismaClient,
    analytics?: AnalyticsService,
    redis?: RedisService,
    thotisAnalytics?: ThotisAnalyticsService
  ) {
    this.analytics = analytics || new AnalyticsService();
    this.redis = redis;
    this.thotisAnalytics = thotisAnalytics || null;

    // Try to initialize Redis if not provided and env vars exist
    if (!this.redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.redis = new RedisService();
      } catch (e) {
        console.warn("Failed to initialize RedisService in ThotisBookingService", e);
      }
    }
  }

  private async invalidateStudentCache(userId: number, studentProfileId: string) {
    if (!this.redis) return;

    try {
      // Invalidate availability version (forces new availability computation)
      await this.redis.set(`availability:version:${studentProfileId}`, Date.now().toString(), {
        ttl: 24 * 60 * 60 * 1000,
      });

      // Invalidate stats cache
      await this.redis.del(`stats:student:${userId}`);

      // Invalidate profile cache
      await this.redis.del(`profile:${userId}`);
    } catch (error) {
      console.warn("Failed to invalidate cache", error);
    }
  }

  /**
   * Creates a new student mentoring session
   * Enforces 15-minute duration and validates availability
   * Property 8: Session Duration Invariant
   * Property 14: Minimum Booking Notice
   * Property 7: Double Booking Prevention
   */
  async createStudentSession(input: {
    studentProfileId: string;
    dateTime: Date;
    prospectiveStudent: {
      name: string;
      email: string;
      question?: string;
    };
  }): Promise<{
    bookingId: number;
    googleMeetLink: string;
    calendarEventId: string;
    confirmationSent: boolean;
  }> {
    // Validate minimum booking notice (2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (input.dateTime < twoHoursFromNow) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Bookings must be made at least 2 hours in advance");
    }

    // Validate student profile exists and is active
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { id: input.studentProfileId },
      select: {
        id: true,
        userId: true,
        isActive: true,
        status: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            studentProfile: {
              select: {
                field: true,
              },
            },
          },
        },
      },
    });

    if (!studentProfile) {
      throw new ErrorWithCode(ErrorCode.NotFound, `Student profile ${input.studentProfileId} not found`);
    }

    if (studentProfile.status !== MentorStatus.VERIFIED) {
      throw new ErrorWithCode(
        ErrorCode.BadRequest,
        "Student profile is not verified and cannot accept bookings"
      );
    }

    // Calculate end time (exactly 15 minutes)
    const startTime = input.dateTime;
    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

    // Check for double booking (Property 7)
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        userId: studentProfile.userId,
        status: {
          in: ["ACCEPTED", "PENDING"],
        },
        OR: [
          {
            // New booking starts during existing booking
            AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
          },
          {
            // New booking ends during existing booking
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            // New booking completely contains existing booking
            AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
          },
        ],
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    if (existingBooking) {
      throw new ErrorWithCode(
        ErrorCode.BookingConflict,
        `Time slot ${startTime.toISOString()} is already booked`
      );
    }

    // Get or create Thotis event type for this student
    let eventType = await this.prisma.eventType.findFirst({
      where: {
        userId: studentProfile.userId,
        metadata: {
          path: ["isThotisSession"],
          equals: true,
        },
      },
      select: {
        id: true,
        length: true,
      },
    });

    if (!eventType) {
      // Create Thotis event type
      eventType = await this.prisma.eventType.create({
        data: {
          userId: studentProfile.userId,
          title: "Thotis Student Mentoring Session",
          slug: "thotis-mentoring-session",
          length: 15,
          hidden: true, // Hidden from public booking page
          metadata: {
            isThotisSession: true,
            lockedDuration: true,
            studentProfileId: input.studentProfileId,
          } as Prisma.InputJsonValue,
          minimumBookingNotice: 120,
        },
        select: {
          id: true,
          length: true,
        },
      });
    }

    // Validate event type duration is exactly 15 minutes (Property 8)
    if (eventType.length !== 15) {
      throw new ErrorWithCode(ErrorCode.InternalServerError, "Session duration must be exactly 15 minutes");
    }

    // Generate Meeting link (Property 32)
    // Use integrations:google-video by default for Thotis sessions
    // This will be handled by CalendarManager/createEvent mostly,
    // but we can set it as default location.
    // Use integrations:google-video to trigger Cal.com's Google Calendar integration
    const googleMeetLink = "integrations:google-video";

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        uid: uuid(),
        userId: studentProfile.userId,
        eventTypeId: eventType.id,
        startTime,
        endTime,
        title: "Thotis Student Mentoring Session",
        description: input.prospectiveStudent.question || "Student mentoring session",
        status: "PENDING",
        metadata: {
          isThotisSession: true,
          studentProfileId: input.studentProfileId,
          prospectiveStudentName: input.prospectiveStudent.name,
          prospectiveStudentEmail: input.prospectiveStudent.email,
          question: input.prospectiveStudent.question,
          googleMeetLink,
        } as Prisma.InputJsonValue,
        responses: {
          name: input.prospectiveStudent.name,
          email: input.prospectiveStudent.email,
          notes: input.prospectiveStudent.question,
        } as Prisma.InputJsonValue,
        attendees: {
          create: {
            email: input.prospectiveStudent.email,
            name: input.prospectiveStudent.name,
            timeZone: "Europe/Paris",
            locale: "fr",
          },
        },
      },
      select: {
        id: true,
        uid: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        userId: true, // Needed for analytics
        metadata: true, // Needed for analytics
        responses: true, // Needed for webhooks
      },
    });

    // Update student profile statistics
    await this.prisma.studentProfile.update({
      where: { id: input.studentProfileId },
      data: {
        totalSessions: {
          increment: 1,
        },
      },
    });

    // Invalidate caches
    await this.invalidateStudentCache(studentProfile.userId, input.studentProfileId);

    // Track analytics
    this.analytics.trackBookingCreated(
      {
        id: booking.id,
        userId: booking.userId, // Student/Mentor ID
        startTime,
        endTime,
        metadata: booking.metadata,
      },
      input.prospectiveStudent.email
    );

    // Track Postgres Analytics
    if (this.thotisAnalytics) {
      await this.thotisAnalytics.track({
        eventType: ThotisAnalyticsEventType.booking_confirmed,
        userId: booking.userId || undefined,
        profileId: input.studentProfileId,
        bookingId: booking.id,
        field: studentProfile.user.studentProfile?.field || undefined,
        metadata: booking.metadata as Record<string, any>,
      });
    }

    // Trigger Webhook
    const { thotisWebhooks } = await import("../../../../apps/web/lib/webhooks/thotis");
    await thotisWebhooks.onBookingCreated(
      booking,
      input.studentProfileId,
      studentProfile.user.studentProfile?.field
    );

    // Prepare Calendar Event Data
    const organizerUser = await this.prisma.user.findUnique({
      where: { id: studentProfile.userId },
      select: { email: true, name: true, timeZone: true, locale: true, timeFormat: true },
    });

    const organizer: Person = {
      name: organizerUser?.name || "Mentor",
      email: organizerUser?.email || "",
      timeZone: organizerUser?.timeZone || "Europe/Paris",
      language: { translate: ((key: string) => key) as TFunction, locale: organizerUser?.locale || "fr" },
      timeFormat: organizerUser?.timeFormat === 24 ? TimeFormat.TWENTY_FOUR_HOUR : TimeFormat.TWELVE_HOUR,
    };

    const attendee: Person = {
      name: input.prospectiveStudent.name,
      email: input.prospectiveStudent.email,
      timeZone: "Europe/Paris", // Default for Thotis
      language: { translate: ((key: string) => key) as TFunction, locale: "fr" },
      timeFormat: TimeFormat.TWENTY_FOUR_HOUR,
    };

    const calEvent: CalendarEvent = {
      type: "thotis-mentoring",
      title: booking.title,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      organizer,
      attendees: [attendee],
      location: googleMeetLink,
      description: booking.description || "",
      uid: booking.uid,
    };

    // Send Confirmation Email
    try {
      const email = new BookingConfirmationEmail(calEvent, attendee);
      await email.sendEmail();
    } catch (error) {
      console.error("Failed to send confirmation email", error);
    }

    // Sync with Google Calendar
    try {
      const credentials = await this.prisma.credential.findMany({
        where: { userId: studentProfile.userId, type: "google_calendar" },
      });

      if (credentials.length > 0) {
        const credential = credentials[0] as unknown as CredentialForCalendarService;
        const result = await createEvent(credential, calEvent);

        if (result.success && result.createdEvent?.location) {
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: {
              location: result.createdEvent.location,
              metadata: {
                ...(booking.metadata as object),
                googleMeetLink: result.createdEvent.location,
              } as Prisma.InputJsonValue,
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to sync with Google Calendar", error);
    }

    // Unify video link generation (Reliability)
    const finalizedBooking = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      select: { id: true, location: true, uid: true, metadata: true },
    });

    if (finalizedBooking) {
      const videoLink = await this.ensureVideoLink(
        finalizedBooking.id, // wait finalizedBooking doesn't have id in select
        finalizedBooking.uid,
        finalizedBooking.location,
        finalizedBooking.metadata
      );
      return {
        bookingId: booking.id,
        googleMeetLink: videoLink,
        calendarEventId: booking.uid,
        confirmationSent: true,
      };
    }

    return {
      bookingId: booking.id,
      googleMeetLink, // Fallback to integrations:google-video if somehow record not found
      calendarEventId: booking.uid,
      confirmationSent: true,
    };
  }

  /**
   * Ensures a valid video link exists for the booking (Property 32)
   * Falls back to Jitsi if Google Meet generation fails
   */
  private async ensureVideoLink(
    bookingId: number,
    uid: string,
    currentLocation: string | null,
    metadata: Prisma.JsonValue
  ): Promise<string> {
    if (currentLocation && currentLocation !== "integrations:google-video") {
      return currentLocation;
    }

    // Reliability: Generate a stable fallback link
    const fallbackLink = `https://meet.jit.si/thotis-${uid}`;

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        location: fallbackLink,
        metadata: {
          ...(metadata as object),
          googleMeetLink: fallbackLink,
          isFallbackLink: true,
        } as Prisma.InputJsonValue,
      },
    });

    return fallbackLink;
  }

  /**
   * Gets available time slots for a student mentor
   * Uses Cal.com's core availability engine
   */
  async getStudentAvailability(
    studentProfileId: string,
    dateRange: { start: Date; end: Date },
    timeZone: string = "Europe/Paris"
  ): Promise<Array<{ start: Date; end: Date; available: boolean }>> {
    // Validate date range is within 30 days
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (dateRange.end > thirtyDaysFromNow) {
      throw new ErrorWithCode(
        ErrorCode.BadRequest,
        "Availability can only be queried up to 30 days in advance"
      );
    }

    // 1. Get student profile and associated user
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!studentProfile || !studentProfile.user) {
      throw new ErrorWithCode(ErrorCode.NotFound, "Student profile or user not found");
    }

    if (studentProfile.status !== MentorStatus.VERIFIED) {
      return [];
    }

    // 2. Get or create Thotis event type
    let eventType = await this.prisma.eventType.findFirst({
      where: {
        userId: studentProfile.user.id,
        slug: "thotis-mentoring-session",
      },
      select: { id: true, length: true },
    });

    if (!eventType) {
      // Create defaults if missing (should be provisioned by admin ideally)
      eventType = await this.prisma.eventType.create({
        data: {
          title: "Session de mentorat Thotis",
          slug: "thotis-mentoring-session",
          length: 15,
          userId: studentProfile.user.id,
          hidden: true,
          metadata: {
            isThotisSession: true,
          },
        },
        select: { id: true, length: true },
      });
    }

    // 3. Use Cal.com's availability service
    try {
      // Dynamic import to avoid circular dependencies in some setups
      const { getAvailableSlotsService } = await import("@calcom/features/di/containers/AvailableSlots");
      const availableSlotsService = getAvailableSlotsService();

      const startIso = dateRange.start.toISOString();
      const endIso = dateRange.end.toISOString();

      // We need to pass a context that satisfies strict checks if possible, or minimally correct input
      const input = {
        eventTypeId: eventType.id,
        usernameList: [studentProfile.user.username!],
        startTime: startIso,
        endTime: endIso,
        timeZone: timeZone,
        orgSlug: "", // Bypass org context lookups
        isTeamEvent: false,
      };

      // Helper to mock request for orgDomainConfig if needed internally
      const mockCtx: ContextForGetSchedule = {
        req: {
          headers: {},
          cookies: {},
        } as unknown as ContextForGetSchedule["req"],
      };

      const result = await availableSlotsService.getAvailableSlots({
        input,
        ctx: mockCtx,
      });

      // 4. Transform result to simple slot array
      const slots: Array<{ start: Date; end: Date; available: boolean }> = [];

      // result.slots is Record<string, Slot[]> where string is date YYYY-MM-DD
      Object.keys(result.slots).forEach((dateKey) => {
        const daySlots = result.slots[dateKey];
        daySlots.forEach((slot) => {
          slots.push({
            start: new Date(slot.time),
            end: new Date(new Date(slot.time).getTime() + eventType!.length * 60 * 1000),
            available: true,
          });
        });
      });

      return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
    } catch (error) {
      console.error("Error fetching availability via engine:", error);
      // Fallback or rethrow?
      // If engine fails, we probably shouldn't show availability to avoid double bookings
      throw new ErrorWithCode(ErrorCode.InternalServerError, "Failed to fetch availability");
    }
  }

  /**
   * Cancels a session with validation
   * Property 14: Minimum cancellation notice (2 hours)
   */
  async cancelSession(
    bookingId: number,
    reason: string,
    cancelledBy: "mentor" | "student",
    requester: { id?: number; email?: string }
  ): Promise<void> {
    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        uid: true,
        startTime: true,
        endTime: true,
        status: true,
        metadata: true,
        userId: true,
        responses: true,
        eventType: {
          select: {
            userId: true,
            minimumBookingNotice: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ErrorWithCode(ErrorCode.NotFound, `Booking ${bookingId} not found`);
    }

    // Verify ownership
    this.verifySessionOwnership(booking, requester);

    // Validate booking is not already cancelled
    if (booking.status === "CANCELLED") {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Booking is already cancelled");
    }

    // Validate minimum cancellation notice (default 120 mins if not set)
    const minimumBookingNotice = booking.eventType?.minimumBookingNotice ?? 120;
    const now = new Date();
    const noticeThreshold = new Date(now.getTime() + minimumBookingNotice * 60 * 1000);

    if (booking.startTime < noticeThreshold) {
      throw new ErrorWithCode(
        ErrorCode.BadRequest,
        `Bookings must be cancelled at least ${minimumBookingNotice} minutes in advance`
      );
    }

    // Get student profile ID from metadata
    const metadata = booking.metadata as { studentProfileId?: string } | null;
    const studentProfileId = metadata?.studentProfileId;

    // Update booking status
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        metadata: {
          ...(booking.metadata as object),
          cancelledBy,
          cancelledAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    // Update student profile statistics and invalidate cache
    if (studentProfileId) {
      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: { userId: true },
      });

      if (studentProfile) {
        await this.invalidateStudentCache(studentProfile.userId, studentProfileId);
      }

      await this.prisma.studentProfile.update({
        where: { id: studentProfileId },
        data: {
          cancelledSessions: {
            increment: 1,
          },
        },
      });
    }

    // Send cancellation emails
    try {
      if (booking.eventType?.userId) {
        const organizerUser = await this.prisma.user.findUnique({
          where: { id: booking.eventType.userId },
          select: { email: true, name: true, timeZone: true, locale: true, timeFormat: true },
        });
        // Reconstruct minimal CalEvent for email
        const organizer: Person = {
          name: organizerUser?.name || "Mentor",
          email: organizerUser?.email || "",
          timeZone: organizerUser?.timeZone || "Europe/Paris",
          language: { translate: ((key: string) => key) as TFunction, locale: organizerUser?.locale || "fr" },
          timeFormat: organizerUser?.timeFormat === 24 ? TimeFormat.TWENTY_FOUR_HOUR : TimeFormat.TWELVE_HOUR,
        };
        // Retrieve attendee details from metadata if possible, or booking responses
        const responses = booking.responses as { email?: string; name?: string } | null;
        const attendeeEmail = responses?.email || "";
        const attendeeName = responses?.name || "Student";

        const attendee: Person = {
          name: attendeeName,
          email: attendeeEmail,
          timeZone: "Europe/Paris",
          language: { translate: ((key: string) => key) as TFunction, locale: "fr" },
          timeFormat: TimeFormat.TWENTY_FOUR_HOUR,
        };

        const calEvent: CalendarEvent = {
          type: "thotis-mentoring",
          title: "Thotis Student Mentoring Session",
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          organizer,
          attendees: [attendee],
          uid: booking.uid,
        };

        const email = new BookingCancellationEmail(calEvent, attendee);
        await email.sendEmail();

        // Delete Google Calendar event
        const credentials = await this.prisma.credential.findMany({
          where: { userId: booking.eventType.userId, type: "google_calendar" },
        });
        if (credentials.length > 0) {
          const credential = credentials[0] as unknown as CredentialForCalendarService;
          await deleteEvent({ credential, bookingRefUid: booking.uid, event: calEvent });
        }
      }
    } catch (error) {
      console.error("Failed to process cancellation side effects", error);
    }

    this.analytics.trackBookingCancelled(
      {
        id: booking.id,
        userId: booking.eventType?.userId || booking.userId, // Fallback to booking.userId
        metadata: booking.metadata,
      },
      reason,
      cancelledBy
    );

    // Track Postgres Analytics
    if (this.thotisAnalytics) {
      await this.thotisAnalytics.track({
        eventType: ThotisAnalyticsEventType.cancelled,
        userId: booking.eventType?.userId || booking.userId || undefined,
        profileId: studentProfileId,
        bookingId: booking.id,
        metadata: {
          reason,
          cancelledBy,
        },
      });
    }

    // Trigger Webhook
    const { thotisWebhooks } = await import("../../../../apps/web/lib/webhooks/thotis");
    await thotisWebhooks.onBookingCancelled(booking, reason);
  }

  /**
   * Reschedules a session to a new time
   * Property 32: Rescheduling Meet Link Regeneration
   */
  async rescheduleSession(
    bookingId: number,
    newDateTime: Date,
    requester: { id?: number; email?: string }
  ): Promise<{
    bookingId: number;
    googleMeetLink: string;
    calendarEventId: string;
    confirmationSent: boolean;
  }> {
    // Validate minimum booking notice (2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (newDateTime < twoHoursFromNow) {
      throw new ErrorWithCode(
        ErrorCode.BadRequest,
        "Rescheduled bookings must be at least 2 hours in advance"
      );
    }

    // Get existing booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        uid: true,
        userId: true,
        startTime: true,
        endTime: true,
        status: true,
        metadata: true,
        responses: true,
        eventType: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ErrorWithCode(ErrorCode.NotFound, `Booking ${bookingId} not found`);
    }

    // Verify ownership
    this.verifySessionOwnership(booking, requester);

    // Validate booking is not cancelled
    if (booking.status === "CANCELLED") {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Cannot reschedule a cancelled booking");
    }

    // Calculate new end time (exactly 15 minutes)
    const newStartTime = newDateTime;
    const newEndTime = new Date(newStartTime.getTime() + 15 * 60 * 1000);

    // Check for conflicts at new time
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        id: { not: bookingId }, // Exclude current booking
        userId: booking.eventType?.userId, // Use optional chaining just in case
        status: {
          in: ["ACCEPTED", "PENDING"],
        },
        OR: [
          {
            AND: [{ startTime: { lte: newStartTime } }, { endTime: { gt: newStartTime } }],
          },
          {
            AND: [{ startTime: { lt: newEndTime } }, { endTime: { gte: newEndTime } }],
          },
          {
            AND: [{ startTime: { gte: newStartTime } }, { endTime: { lte: newEndTime } }],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new ErrorWithCode(
        ErrorCode.BookingConflict,
        `Time slot ${newStartTime.toISOString()} is already booked`
      );
    }

    // Generate new Google Meet link (Property 32)
    const newGoogleMeetLink = "integrations:google-video";

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
        metadata: {
          ...(booking.metadata as object),
          googleMeetLink: newGoogleMeetLink,
          oldStartTime: booking.startTime.toISOString(),
          rescheduledAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        uid: true,
      },
    });

    // Unify video link generation (Reliability)
    const finalizedBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, uid: true, location: true, metadata: true },
    });

    let finalizedMeetLink = newGoogleMeetLink;
    if (finalizedBooking) {
      finalizedMeetLink = await this.ensureVideoLink(
        finalizedBooking.id,
        finalizedBooking.uid,
        finalizedBooking.location,
        finalizedBooking.metadata
      );
    }

    // Invalidate caches
    const updatedBookingWithUser = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        eventType: { select: { userId: true } },
        metadata: true,
      },
    });

    if (updatedBookingWithUser) {
      const metadata = updatedBookingWithUser.metadata as { studentProfileId?: string } | null;
      const studentProfileId = metadata?.studentProfileId;
      if (studentProfileId && updatedBookingWithUser.eventType?.userId) {
        await this.invalidateStudentCache(updatedBookingWithUser.eventType.userId, studentProfileId);
      }
    }

    // Send rescheduling emails
    try {
      if (booking.eventType?.userId) {
        const organizerUser = await this.prisma.user.findUnique({
          where: { id: booking.eventType.userId },
          select: { email: true, name: true, timeZone: true, locale: true, timeFormat: true },
        });

        const organizer: Person = {
          name: organizerUser?.name || "Mentor",
          email: organizerUser?.email || "",
          timeZone: organizerUser?.timeZone || "Europe/Paris",
          language: { translate: ((key: string) => key) as TFunction, locale: organizerUser?.locale || "fr" },
          timeFormat: organizerUser?.timeFormat === 24 ? TimeFormat.TWENTY_FOUR_HOUR : TimeFormat.TWELVE_HOUR,
        };

        const responses = booking.responses as { email?: string; name?: string } | null;
        const attendee: Person = {
          name: responses?.name || "Student",
          email: responses?.email || "",
          timeZone: "Europe/Paris",
          language: { translate: ((key: string) => key) as TFunction, locale: "fr" },
          timeFormat: TimeFormat.TWENTY_FOUR_HOUR,
        };

        const calEvent: CalendarEvent = {
          type: "thotis-mentoring",
          title: "Thotis Student Mentoring Session",
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
          organizer,
          attendees: [attendee],
          uid: updatedBooking.uid,
          location: finalizedMeetLink,
        };

        const email = new BookingRescheduledEmail(calEvent, attendee);
        await email.sendEmail();

        // Update Google Calendar event
        const credentials = await this.prisma.credential.findMany({
          where: { userId: booking.eventType.userId, type: "google_calendar" },
        });
        if (credentials.length > 0) {
          const credential = credentials[0] as unknown as CredentialForCalendarService;
          await updateEvent(credential, calEvent, updatedBooking.uid, null);
        }
      }
    } catch (error) {
      console.error("Failed to process rescheduling side effects", error);
    }

    // Trigger Webhook
    const { thotisWebhooks } = await import("../../../../apps/web/lib/webhooks/thotis");
    await thotisWebhooks.onBookingRescheduled(updatedBooking, newStartTime, newEndTime, finalizedMeetLink);

    // Track Postgres Analytics
    if (this.thotisAnalytics) {
      await this.thotisAnalytics.track({
        eventType: ThotisAnalyticsEventType.rescheduled,
        userId: booking.eventType?.userId || booking.userId || undefined,
        bookingId: updatedBooking.id,
        metadata: {
          newStartTime,
          newEndTime,
        },
      });
    }

    return {
      bookingId: updatedBooking.id,
      googleMeetLink: finalizedMeetLink,
      calendarEventId: updatedBooking.uid,
      confirmationSent: true,
    };
  }

  /**
   * Marks a session as complete
   * Property 19: Session Counter Updates
   */
  async markSessionComplete(
    bookingId: number,
    requester: { id?: number; email?: string; isSystem?: boolean }
  ): Promise<void> {
    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        uid: true,
        status: true,
        startTime: true,
        endTime: true,
        metadata: true,
        userId: true,
        responses: true,
        eventType: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ErrorWithCode(ErrorCode.NotFound, `Booking ${bookingId} not found`);
    }

    // Verify ownership
    this.verifySessionOwnership(booking, requester);

    // Validate booking is not cancelled
    if (booking.status === "CANCELLED") {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Cannot complete a cancelled booking");
    }

    // Validate session has ended
    const now = new Date();
    if (booking.endTime > now) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Cannot mark session as complete before it has ended");
    }

    // Get student profile ID from metadata
    const metadata = booking.metadata as { studentProfileId?: string } | null;
    const studentProfileId = metadata?.studentProfileId;

    // Update booking status
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "ACCEPTED", // Cal.com uses ACCEPTED for completed bookings
        metadata: {
          ...(booking.metadata as object),
          completedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    // Update student profile statistics (Property 19) and invalidate cache
    if (studentProfileId) {
      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: { userId: true },
      });

      if (studentProfile) {
        await this.invalidateStudentCache(studentProfile.userId, studentProfileId);
      }

      await this.prisma.studentProfile.update({
        where: { id: studentProfileId },
        data: {
          completedSessions: {
            increment: 1,
          },
        },
      });
    }

    // Trigger Webhook
    const { thotisWebhooks } = await import("../../../../apps/web/lib/webhooks/thotis");
    await thotisWebhooks.onBookingCompleted(booking, 15); // Duration is fixed 15 min

    this.analytics.trackBookingCompleted({
      id: booking.id,
      userId: booking.userId,
      metadata: booking.metadata,
    });

    // Track Postgres Analytics
    if (this.thotisAnalytics) {
      await this.thotisAnalytics.track({
        eventType: ThotisAnalyticsEventType.session_completed,
        userId: booking.userId || undefined,
        profileId: studentProfileId,
        bookingId: booking.id,
        metadata: booking.metadata as Record<string, any>,
      });
    }
  }

  /**
   * Marks a session as a No-Show
   * Automatically triggered by lifecycle cron or manually by admin/student
   */
  async markSessionAsNoShow(
    bookingId: number,
    requester: { id?: number; email?: string; isSystem?: boolean }
  ): Promise<void> {
    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        uid: true,
        status: true,
        startTime: true,
        endTime: true,
        metadata: true,
        userId: true,
        responses: true,
        eventType: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ErrorWithCode(ErrorCode.NotFound, `Booking ${bookingId} not found`);
    }

    // Verify ownership
    this.verifySessionOwnership(booking, requester);

    // Validate booking is not already cancelled
    if (booking.status === "CANCELLED") {
      // If it's already cancelled with no_show_auto, we're good
      const metadata = booking.metadata as { cancellationReason?: string } | null;
      if (metadata?.cancellationReason === "no_show_auto") return;

      throw new ErrorWithCode(ErrorCode.BadRequest, "Booking is already cancelled");
    }

    // Get student profile ID from metadata
    const metadata = booking.metadata as { studentProfileId?: string } | null;
    const studentProfileId = metadata?.studentProfileId;

    // Update booking status to CANCELLED with reason
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: "no_show_auto",
        metadata: {
          ...(booking.metadata as object),
          noShowDetectedAt: new Date().toISOString(),
          cancelledBy: requester.isSystem ? "system" : "student",
        } as Prisma.InputJsonValue,
      },
    });

    // Update student profile statistics and create incident
    if (studentProfileId) {
      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: { userId: true },
      });

      if (studentProfile) {
        await this.invalidateStudentCache(studentProfile.userId, studentProfileId);
      }

      // Increment cancelled sessions
      await this.prisma.studentProfile.update({
        where: { id: studentProfileId },
        data: {
          cancelledSessions: {
            increment: 1,
          },
        },
      });

      // Automatically create a MentorQualityIncident for automated No-Show
      await this.prisma.mentorQualityIncident.create({
        data: {
          studentProfileId,
          bookingUid: booking.uid,
          type: MentorIncidentType.NO_SHOW,
          description: "Automated no-show detection by system lifecycle cron.",
          reportedByUserId: null, // System report
        },
      });
    }

    // Trigger Webhook
    try {
      const { thotisWebhooks } = await import("../../../../apps/web/lib/webhooks/thotis");
      await thotisWebhooks.onBookingCancelled(booking, "Automatically cancelled due to no-show");
    } catch (e) {
      console.warn("Failed to trigger thotisWebhooks.onBookingCancelled for no-show", e);
    }

    this.analytics.trackBookingCancelled(
      {
        id: booking.id,
        userId: booking.userId,
        metadata: booking.metadata,
      },
      "no_show_auto",
      requester.isSystem ? "system" : "student"
    );

    // Track Postgres Analytics
    if (this.thotisAnalytics) {
      await this.thotisAnalytics.track({
        eventType: ThotisAnalyticsEventType.no_show,
        userId: booking.userId || undefined,
        profileId: studentProfileId,
        bookingId: booking.id,
        metadata: {
          ...(booking.metadata as Record<string, any>),
          autoDetected: true,
        },
      });
    }
  }

  /**
   * Verifies that the requester is authorized to manage the booking.
   * Authorized users are:
   * 1. The mentor (host) associated with the booking (by ID)
   * 2. The prospective student (guest) associated with the booking (by email)
   */
  private verifySessionOwnership(
    booking: {
      userId: number | null;
      responses: Prisma.JsonValue;
      eventType?: { userId: number | null } | null;
    },
    requester: { id?: number; email?: string; isSystem?: boolean }
  ): void {
    if (requester.isSystem) return;

    const isMentor =
      requester.id && (booking.userId === requester.id || booking.eventType?.userId === requester.id);
    const responses = booking.responses as { email?: string } | null;
    const isStudent = requester.email && responses?.email === requester.email;

    if (!isMentor && !isStudent) {
      throw new ErrorWithCode(
        ErrorCode.Forbidden,
        "You are not authorized to perform this action on this session"
      );
    }
  }
}
