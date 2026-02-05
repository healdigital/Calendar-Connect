import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class BookingOutputDto {
  @Expose()
  @ApiProperty({ description: "The ID of the booking" })
  bookingId!: number;

  @Expose()
  @ApiProperty({ description: "The Google Meet link for the session" })
  googleMeetLink!: string;

  @Expose()
  @ApiProperty({ description: "The unique calendar event ID" })
  calendarEventId!: string;

  @Expose()
  @ApiProperty({ description: "Whether the confirmation email was sent" })
  confirmationSent!: boolean;
}

export class BookingResponseDto {
  @Expose()
  @ApiProperty({ description: "Status of the request" })
  status!: string;

  @Expose()
  @ApiProperty({ description: "Booking data", type: BookingOutputDto })
  data!: BookingOutputDto;
}
