import { SessionRatingService, StatisticsService } from "@calcom/platform-libraries";
import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Bookings")
@Controller("bookings")
export class BookingsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly sessionRatingService: SessionRatingService
  ) {}

  @Post(":id/rating")
  async createRating(
    @Param("id") id: string,
    @Body() body: { rating: number; feedback?: string; studentId: number }
  ) {
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId)) {
      throw new BadRequestException("Invalid booking ID");
    }

    if (!body.studentId) {
      throw new BadRequestException("Student ID is required");
    }

    try {
      // Use SessionRatingService for creation to enforce strict validation rules
      // (1-5 rating, 10-500 char feedback)
      await this.sessionRatingService.createRating({
        bookingId,
        studentProfileId: body.studentId,
        rating: body.rating,
        feedback: body.feedback,
      });

      // Recalculate average rating after adding new rating
      await this.statisticsService.recalculateAverageRating(body.studentId);

      return {
        status: "success",
        message: "Rating submitted successfully",
      };
    } catch (error: any) {
      if (error.code === "INVALID_RATING" || error.code === "INVALID_FEEDBACK") {
        throw new BadRequestException(error.message);
      }
      throw new HttpException(
        { status: "error", message: error instanceof Error ? error.message : "Error submitting rating" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
