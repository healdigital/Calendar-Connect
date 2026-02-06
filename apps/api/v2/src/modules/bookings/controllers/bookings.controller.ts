import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BookingsService } from "../services/bookings.service";
import { CreateBookingInput } from "./inputs/create-booking.input";
import { RescheduleBookingInput } from "./inputs/reschedule-booking.input";
import { BookingResponseDto } from "./outputs/booking.output";
import { API_VERSIONS_VALUES } from "@/lib/api-versions";
import { GetUser } from "@/modules/auth/decorators/get-user/get-user.decorator";
import { ApiAuthGuard } from "@/modules/auth/guards/api-auth/api-auth.guard";
import { ApiAuthGuardUser } from "@/modules/auth/strategies/api-auth/api-auth.strategy";

@Controller({
  path: "/v2/bookings",
  version: API_VERSIONS_VALUES,
})
@ApiTags("Bookings")
@UseGuards(ApiAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new booking" })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async createBooking(@Body() input: CreateBookingInput): Promise<BookingResponseDto> {
    const result = await this.bookingsService.createBooking({
      studentProfileId: input.studentProfileId,
      dateTime: new Date(input.dateTime),
      prospectiveStudent: {
        name: input.name,
        email: input.email,
        question: input.question,
      },
    });

    return {
      status: "success",
      data: result,
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a booking by ID" })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async getBooking(@Param("id", ParseIntPipe) id: number): Promise<BookingResponseDto> {
    const result = await this.bookingsService.getBooking(id);
    if (!result) {
      throw new Error("Booking not found"); // NestJS will handle exception filtering if set up, or I should throw NotFoundException
    }
    return {
      status: "success",
      data: result,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  // Guard is applied at controller level
  @ApiOperation({ summary: "Cancel a booking" })
  async cancelBooking(
    @Param("id", ParseIntPipe) id: number,
    @GetUser() user: ApiAuthGuardUser
  ): Promise<{ status: string }> {
    await this.bookingsService.cancelBooking(id, "Cancelled via API", user);
    return { status: "success" };
  }

  @Patch(":id/reschedule")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reschedule a booking" })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async rescheduleBooking(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: RescheduleBookingInput,
    @GetUser() user: ApiAuthGuardUser
  ): Promise<BookingResponseDto> {
    const result = await this.bookingsService.rescheduleBooking(id, new Date(input.newDateTime), user);
    return {
      status: "success",
      data: result,
    };
  }
}
