import { ThotisBookingService } from "@calcom/platform-libraries";
import { Injectable } from "@nestjs/common";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";

@Injectable()
export class BookingsService {
  constructor(
    private readonly thotisBookingService: ThotisBookingService,
    private readonly prismaService: PrismaWriteService
  ) {}

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

  async cancelBooking(bookingId: number, reason: string, requester: { id?: number; email?: string }) {
    // For API v2, we assume "student" role for cancellation if via public/student API
    // We pass the requester context to the service
    return this.thotisBookingService.cancelSession(bookingId, reason, "student", requester);
  }

  async rescheduleBooking(bookingId: number, newDateTime: Date, requester: { id?: number; email?: string }) {
    return this.thotisBookingService.rescheduleSession(bookingId, newDateTime, requester);
  }
}
