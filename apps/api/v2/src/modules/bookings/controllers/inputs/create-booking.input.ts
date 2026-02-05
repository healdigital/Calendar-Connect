import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateBookingInput {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "ID of the student profile to book with" })
  studentProfileId!: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ description: "Date and time of the booking in ISO 8601 format" })
  dateTime!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "Name of the prospective student" })
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: "Email of the prospective student" })
  email!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: "Question or notes from the student" })
  question?: string;
}

export class RescheduleBookingInput {
  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ description: "New date and time for the booking in ISO 8601 format" })
  newDateTime!: string;
}
