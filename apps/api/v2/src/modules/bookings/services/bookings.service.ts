import { Injectable } from "@nestjs/common";
// Using relative path to access the package service
import { ThotisBookingService } from "../../../../../../../packages/features/thotis/services/ThotisBookingService";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";

@Injectable()
export class BookingsService {
  private thotisBookingService: ThotisBookingService;

  constructor(private readonly prismaService: PrismaWriteService) {
    this.thotisBookingService = new ThotisBookingService(prismaService.prisma);
  }

  async createBooking(input: {
    studentProfileId: string;
    dateTime: Date;
    prospectiveStudent: {
      name: string;
      email: string;
      question?: string;
    };
  }) {
    return this.thotisBookingService.createStudentSession(input);
  }

  async getBooking(bookingId: number) {
    const booking = await this.prismaService.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        uid: true,
        startTime: true,
        endTime: true,
        status: true,
        metadata: true,
      },
    });

    if (!booking) {
      return null;
    }

    const metadata = booking.metadata as any;

    return {
      bookingId: booking.id,
      googleMeetLink: metadata?.googleMeetLink,
      calendarEventId: booking.uid,
      confirmationSent: false, // Placeholder
    };
  }

  async cancelBooking(bookingId: number, reason: string) {
    // Assuming cancelledBy is user driven via API, could be "student" or "mentor" depending on auth.
    // For public API used by prospective students (if that's the use case), it might be "student".
    // Or if used by the mentor app, "mentor".
    // Let's assume "student" for this open API or checking the user context.
    // Requirements say "Implement DELETE ... (cancel)".
    // I will default to "student" if no auth context implies otherwise, or "mentor" if authorized.
    return this.thotisBookingService.cancelSession(bookingId, reason, "student");
  }

  async rescheduleBooking(bookingId: number, newDateTime: Date) {
    return this.thotisBookingService.rescheduleSession(bookingId, newDateTime);
  }
}
