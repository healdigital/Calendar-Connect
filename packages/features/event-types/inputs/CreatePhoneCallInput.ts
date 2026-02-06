import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

/**
 * CreatePhoneCallInput
 *
 * Input type for creating a phone call booking
 */
export class CreatePhoneCallInput {
  @ApiProperty({
    description: "The start time of the phone call in ISO 8601 format",
    example: "2024-06-14T10:00:00Z",
  })
  @IsString()
  start!: string;

  @ApiProperty({
    description: "The name of the person booking the call",
    example: "John Doe",
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "The email of the person booking the call",
    example: "john@example.com",
  })
  @IsString()
  email!: string;

  @ApiProperty({
    description: "The phone number for the call",
    example: "+1234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: "Additional notes for the call",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: "The event type ID for the phone call",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  eventTypeId?: number;
}
