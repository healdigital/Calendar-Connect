import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty } from "class-validator";

export class RescheduleBookingInput {
  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ description: "New date and time for the booking in ISO 8601 format" })
  newDateTime!: string;
}
