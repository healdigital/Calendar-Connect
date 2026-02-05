import { ErrorCode } from "@calcom/lib/errorCodes";
import { ErrorWithCode } from "@calcom/lib/errors";
import type { PrismaClient } from "@prisma/client";
import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThotisBookingService } from "./ThotisBookingService";

// Mock Prisma
const prismaMock = {
  booking: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  studentProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  eventType: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(prismaMock)),
} as unknown as PrismaClient;

describe("ThotisBookingService Properties", () => {
  let service: ThotisBookingService;

  beforeEach(() => {
    service = new ThotisBookingService(prismaMock);
    vi.clearAllMocks();
  });

  // Property 8: Session Duration Invariant
  it("should always create sessions exactly 15 minutes long", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .date({ min: new Date(Date.now() + 3 * 3600 * 1000) })
          .filter((d) => !Number.isNaN(d.getTime())), // Future date > 2 hours
        async (date) => {
          // Setup mocks
          (prismaMock.studentProfile.findUnique as any).mockResolvedValue({
            id: "student-1",
            userId: 1,
            isActive: true,
            user: { id: 1, email: "student@example.com", name: "Student" },
          });

          (prismaMock.booking.findFirst as any).mockResolvedValue(null); // No conflicts

          (prismaMock.eventType.findFirst as any).mockResolvedValue({
            id: 1,
            length: 15,
          });

          (prismaMock.booking.create as any).mockImplementation((args: any) => ({
            id: 1,
            uid: "booking-uid",
            startTime: args.data.startTime,
            endTime: args.data.endTime,
            status: "PENDING",
          }));

          const result = await service.createStudentSession({
            studentProfileId: "student-1",
            dateTime: date,
            prospectiveStudent: {
              name: "Test User",
              email: "test@example.com",
            },
          });

          // Verify length property
          const createCall = (prismaMock.booking.create as any).mock.calls[0][0];
          const startTime = createCall.data.startTime.getTime();
          const endTime = createCall.data.endTime.getTime();

          expect(endTime - startTime).toBe(15 * 60 * 1000);
        }
      )
    );
  });

  // Property 14: Minimum Booking Notice
  it("should reject bookings less than 2 hours in advance", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .date({
            min: new Date(),
            max: new Date(Date.now() + 2 * 3600 * 1000 - 1000), // Now to < 2 hours
          })
          .filter((d) => !Number.isNaN(d.getTime())),
        async (date) => {
          // Setup mocks
          (prismaMock.studentProfile.findUnique as any).mockResolvedValue({
            id: "student-1",
            userId: 1,
            isActive: true,
          });

          try {
            await service.createStudentSession({
              studentProfileId: "student-1",
              dateTime: date,
              prospectiveStudent: {
                name: "Test User",
                email: "test@example.com",
              },
            });
            // Should fail
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(ErrorWithCode);
            expect((error as ErrorWithCode).code).toBe(ErrorCode.BadRequest);
          }
        }
      )
    );
  });

  // Property 7: Double Booking Prevention
  it("should detect overlapping bookings", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date(Date.now() + 3 * 3600 * 1000) }).filter((d) => !Number.isNaN(d.getTime())),
        async (date) => {
          // Setup mocks to simulate existing booking at requested time
          (prismaMock.studentProfile.findUnique as any).mockResolvedValue({
            id: "student-1",
            userId: 1,
            isActive: true,
          });

          // Mock finding a conflict
          (prismaMock.booking.findFirst as any).mockResolvedValue({
            id: 2,
            startTime: date,
            endTime: new Date(date.getTime() + 15 * 60 * 1000),
          });

          try {
            await service.createStudentSession({
              studentProfileId: "student-1",
              dateTime: date,
              prospectiveStudent: {
                name: "Test User",
                email: "test@example.com",
              },
            });
            // Should fail
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(ErrorWithCode);
            expect((error as ErrorWithCode).code).toBe(ErrorCode.BookingConflict);
          }
        }
      )
    );
  });

  // Property 12: Availability Time Window
  it("should reject availability queries beyond 30 days", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date() }), // Start date
        fc.integer({ min: 31, max: 100 }), // Days in future > 30
        async (startDate, daysInFuture) => {
          const endDate = new Date(Date.now() + daysInFuture * 24 * 3600 * 1000 + 1000); // Add buffer

          try {
            await service.getStudentAvailability("student-1", {
              start: startDate,
              end: endDate,
            });
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(ErrorWithCode);
            const code = (error as ErrorWithCode).code;
            expect(code).toBe(ErrorCode.BadRequest);
          }
        }
      )
    );
  });

  // Property 30: Google Meet Link Uniqueness
  it("should generate unique Google Meet links", async () => {
    await fc.assert(
      fc.asyncProperty(fc.date({ min: new Date(Date.now() + 3 * 3600 * 1000) }), async (date) => {
        // Setup mocks
        (prismaMock.studentProfile.findUnique as any).mockResolvedValue({
          id: "student-1",
          userId: 1,
          isActive: true,
          user: { id: 1, email: "student@example.com", name: "Student" },
        });

        (prismaMock.booking.findFirst as any).mockResolvedValue(null);

        (prismaMock.eventType.findFirst as any).mockResolvedValue({
          id: 1,
          length: 15,
        });

        (prismaMock.booking.create as any).mockImplementation((args: any) => ({
          id: Math.floor(Math.random() * 10000),
          uid: "booking-uid",
          startTime: args.data.startTime,
          endTime: args.data.endTime,
          status: "PENDING",
        }));

        const result1 = await service.createStudentSession({
          studentProfileId: "student-1",
          dateTime: date,
          prospectiveStudent: {
            name: "Test User 1",
            email: "test1@example.com",
          },
        });

        const result2 = await service.createStudentSession({
          studentProfileId: "student-1",
          dateTime: new Date(date.getTime() + 20 * 60 * 1000), // Different time
          prospectiveStudent: {
            name: "Test User 2",
            email: "test2@example.com",
          },
        });

        expect(result1.googleMeetLink).not.toBe(result2.googleMeetLink);
        expect(result1.googleMeetLink).toMatch(/https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
      })
    );
  });

  // Property 32: Rescheduling Meet Link Regeneration
  it("should regenerate Google Meet link on reschedule", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date(Date.now() + 3 * 3600 * 1000) }), // Original date
        fc.date({ min: new Date(Date.now() + 3 * 3600 * 1000) }), // New date
        async (originalDate, newDate) => {
          // Ensure newDate is different enough to be a valid move (logic handled by service, mainly checks conflicts)
          // We just need ANY valid reschedule to trigger link generation.

          const bookingId = 123;
          const originalLink = "https://meet.google.com/abc-defg-hij";

          // Mock existing booking
          (prismaMock.booking.findUnique as any).mockResolvedValue({
            id: bookingId,
            startTime: originalDate,
            endTime: new Date(originalDate.getTime() + 15 * 60 * 1000),
            status: "PENDING",
            metadata: {
              googleMeetLink: originalLink,
            },
            eventType: {
              userId: 1,
            },
          });

          // Mock no conflict at new time
          (prismaMock.booking.findFirst as any).mockResolvedValue(null);

          // Mock update
          (prismaMock.booking.update as any).mockImplementation((args: any) => ({
            id: bookingId,
            uid: "booking-uid",
            metadata: args.data.metadata,
          }));

          const result = await service.rescheduleSession(bookingId, newDate);

          expect(result.googleMeetLink).not.toBe(originalLink);
          expect(result.googleMeetLink).toMatch(/https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
        }
      )
    );
  });
});
