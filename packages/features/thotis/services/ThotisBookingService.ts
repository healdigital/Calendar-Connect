import process from "node:process";
import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import type { Prisma } from "@prisma/client";
import { RedisService } from "../../redis/RedisService";
import { AnalyticsService } from "./AnalyticsService";

/**
 * Service for managing Thotis student mentoring session bookings
 * Implements business logic for 15-minute sessions with validation
 */
export class ThotisBookingService {
  private analytics: AnalyticsService;
  private redis?: RedisService;
  private readonly AVAILABILITY_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  constructor(
    private readonly prisma: Prisma.TransactionClient | typeof import("@prisma/client").PrismaClient,
    analytics?: AnalyticsService,
    redis?: RedisService
  ) {
    this.analytics = analytics || new AnalyticsService();
    this.redis = redis;

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
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!studentProfile) {
      throw new ErrorWithCode(ErrorCode.NotFound, `Student profile ${input.studentProfileId} not found`);
    }

    if (!studentProfile.isActive) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Student profile is not active");
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
          slug: `thotis-mentoring-${studentProfile.userId}`,
          length: 15,
          hidden: true, // Hidden from public booking page
          metadata: {
            isThotisSession: true,
            lockedDuration: true,
            studentProfileId: input.studentProfileId,
          } as Prisma.InputJsonValue,
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

    // Generate Google Meet link
    const googleMeetLink = `https://meet.google.com/${this.generateMeetCode()}`;

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
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
      },
      select: {
        id: true,
        uid: true,
        startTime: true,
        endTime: true,
        status: true,
        userId: true, // Needed for analytics
        metadata: true, // Needed for analytics
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

    return {
      bookingId: booking.id,
      googleMeetLink,
      calendarEventId: booking.uid,
      confirmationSent: false, // Will be true once email service is implemented
    };
  }

  /**
   * Gets available time slots for a student mentor
   * Property 12: Availability Time Window (30 days)
   */
  async getStudentAvailability(
    studentProfileId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{ start: Date; end: Date; available: boolean }>> {
    // Attempt cache lookup
    if (this.redis) {
      try {
        // Get version
        let version = await this.redis.get<string>(`availability:version:${studentProfileId}`);
        if (!version) {
          version = "1";
          await this.redis.set(`availability:version:${studentProfileId}`, version, {
            ttl: 24 * 60 * 60 * 1000,
          });
        }

        const cacheKey = `availability:${studentProfileId}:${version}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
        const cached =
          await this.redis.get<Array<{ start: string; end: string; available: boolean }>>(cacheKey);

        if (cached) {
          // Parse dates back from string
          return cached.map((slot) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end),
          }));
        }
      } catch (e) {
        console.warn("Redis availability cache error", e);
      }
    }

    // Validate date range is within 30 days
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (dateRange.end > thirtyDaysFromNow) {
      throw new ErrorWithCode(
        ErrorCode.BadRequest,
        "Availability can only be queried up to 30 days in advance"
      );
    }

    // Get student profile
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: {
        userId: true,
        isActive: true,
      },
    });

    if (!studentProfile) {
      throw new ErrorWithCode(ErrorCode.NotFound, `Student profile ${studentProfileId} not found`);
    }

    if (!studentProfile.isActive) {
      return []; // Inactive profiles have no availability
    }

    // Get existing bookings in the date range
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        userId: studentProfile.userId,
        status: {
          in: ["ACCEPTED", "PENDING"],
        },
        startTime: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // TODO: Integrate with Cal.com availability system
    // For now, return a simple availability structure
    // This will be enhanced with actual calendar availability in future tasks

    const slots: Array<{ start: Date; end: Date; available: boolean }> = [];

    // Generate 15-minute slots for business hours (9 AM - 5 PM)
    const current = new Date(dateRange.start);
    current.setHours(9, 0, 0, 0);

    while (current < dateRange.end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + 15 * 60 * 1000);

      // Check if slot conflicts with existing booking
      const hasConflict = existingBookings.some(
        (booking) =>
          (slotStart >= booking.startTime && slotStart < booking.endTime) ||
          (slotEnd > booking.startTime && slotEnd <= booking.endTime) ||
          (slotStart <= booking.startTime && slotEnd >= booking.endTime)
      );

      // Only include slots during business hours
      if (slotStart.getHours() >= 9 && slotEnd.getHours() <= 17) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          available: !hasConflict,
        });
      }

      // Move to next 15-minute slot
      current.setTime(current.getTime() + 15 * 60 * 1000);

      // Skip to next day if past 5 PM
      if (current.getHours() >= 17) {
        current.setDate(current.getDate() + 1);
        current.setHours(9, 0, 0, 0);
      }
    }

    // Set cache
    if (this.redis) {
      try {
        const version = (await this.redis.get<string>(`availability:version:${studentProfileId}`)) || "1";
        const cacheKey = `availability:${studentProfileId}:${version}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
        await this.redis.set(cacheKey, slots, { ttl: this.AVAILABILITY_CACHE_TTL });
      } catch (e) {
        console.warn("Failed to set availability cache", e);
      }
    }

    return slots;
  }

  /**
   * Cancels a session with validation
   * Property 14: Minimum cancellation notice (2 hours)
   */
  async cancelSession(bookingId: number, reason: string, cancelledBy: "mentor" | "student"): Promise<void> {
    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        startTime: true,
        status: true,
        metadata: true,
        userId: true, // Needed for analytics (mapped to userId in eventType generally, but here stored directly on booking for simplicity?)
        // Note: booking.userId is usually the mentor (host).
        eventType: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ErrorWithCode({
        message: `Booking ${bookingId} not found`,
        code: "BOOKING_NOT_FOUND",
        statusCode: 404,
      });
    }

    // Validate booking is not already cancelled
    if (booking.status === "CANCELLED") {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Booking is already cancelled");
    }

    // Validate minimum cancellation notice (2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (booking.startTime < twoHoursFromNow) {
      throw new ErrorWithCode(ErrorCode.BadRequest, "Bookings must be cancelled at least 2 hours in advance");
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

    // TODO: Send cancellation emails
    // TODO: Delete Google Calendar event
    // TODO: Send webhook notification

    this.analytics.trackBookingCancelled(
      {
        id: booking.id,
        userId: booking.eventType?.userId || booking.userId, // Fallback to booking.userId
        metadata: booking.metadata,
      },
      reason,
      cancelledBy
    );
  }

  /**
   * Reschedules a session to a new time
   * Property 32: Rescheduling Meet Link Regeneration
   */
  async rescheduleSession(
    bookingId: number,
    newDateTime: Date
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
        startTime: true,
        endTime: true,
        status: true,
        metadata: true,
        eventType: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ErrorWithCode({
        message: `Booking ${bookingId} not found`,
        code: "BOOKING_NOT_FOUND",
        statusCode: 404,
      });
    }

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
    const newGoogleMeetLink = `https://meet.google.com/${this.generateMeetCode()}`;

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

    // Invalidate caches
    const updatedBookingWithUser = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        eventType: { select: { userId: true } },
        metadata: true,
      },
    });

    if (updatedBookingWithUser) {
      const metadata = updatedBookingWithUser.metadata as { studentProfileId?: string } | null;
      const studentProfileId = metadata?.studentProfileId;
      if (studentProfileId && updatedBookingWithUser.eventType) {
        await this.invalidateStudentCache(updatedBookingWithUser.eventType.userId, studentProfileId);
      }
    }

    // TODO: Send rescheduling emails with old and new times
    // TODO: Update Google Calendar event
    // TODO: Send webhook notification

    return {
      bookingId: updatedBooking.id,
      googleMeetLink: newGoogleMeetLink,
      calendarEventId: updatedBooking.uid,
      confirmationSent: false,
    };
  }

  /**
   * Marks a session as complete
   * Property 19: Session Counter Updates
   */
  async markSessionComplete(bookingId: number): Promise<void> {
    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        endTime: true,
        metadata: true,
        userId: true,
      },
    });

    if (!booking) {
      throw new ErrorWithCode({
        message: `Booking ${bookingId} not found`,
        code: "BOOKING_NOT_FOUND",
        statusCode: 404,
      });
    }

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

    // TODO: Send feedback request email
    // TODO: Send webhook notification

    this.analytics.trackBookingCompleted({
      id: booking.id,
      userId: booking.userId,
      metadata: booking.metadata,
    });
  }

  /**
   * Generates a random Google Meet code
   * Format: xxx-yyyy-zzz (3-4-3 characters)
   */
  private generateMeetCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `${part1}-${part2}-${part3}`;
  }
}
