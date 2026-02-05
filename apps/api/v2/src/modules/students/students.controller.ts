import {
  ProfileService,
  SessionRatingService,
  StatisticsService,
  ThotisBookingService,
} from "@calcom/platform-libraries";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Students")
@Controller("students")
@UseGuards(AuthGuard("jwt"))
export class StudentsController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly thotisBookingService: ThotisBookingService,
    private readonly statisticsService: StatisticsService,
    private readonly sessionRatingService: SessionRatingService
  ) {}

  @Get("by-field/:field")
  async getStudentsByField(
    @Param("field") field: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    // Note: limit and offset are unused for now as the service hardcodes pageSize
    try {
      const profiles = await this.profileService.getProfilesByField(field);
      return {
        status: "success",
        data: profiles,
      };
    } catch (error) {
      throw new HttpException(
        { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  async getStudent(@Param("id") id: string) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      throw new BadRequestException("Invalid ID format");
    }

    try {
      const profile = await this.profileService.getProfile(userId);
      if (!profile) {
        throw new NotFoundException("Profile not found");
      }
      return {
        status: "success",
        data: profile,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id/availability")
  async getAvailability(@Param("id") id: string, @Query("start") start: string, @Query("end") end: string) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      throw new BadRequestException("Invalid ID format");
    }

    if (!start || !end) {
      throw new BadRequestException("Start and end dates are required");
    }

    try {
      // We need the profile ID, not the user ID, for booking service
      const profile = await this.profileService.getProfile(userId);
      if (!profile) {
        throw new NotFoundException("Profile not found");
      }

      const availability = await this.thotisBookingService.getStudentAvailability(profile.id, {
        start: new Date(start),
        end: new Date(end),
      });
      return {
        status: "success",
        data: availability,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        { status: "error", message: error instanceof Error ? error.message : "Errors getting availability" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id/stats")
  async getStudentStats(@Param("id") id: string) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      throw new BadRequestException("Invalid ID format");
    }

    try {
      const stats = await this.statisticsService.getStudentStats(userId);
      if (!stats) {
        throw new NotFoundException("Stats not found for student");
      }
      return {
        status: "success",
        data: stats,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        { status: "error", message: error instanceof Error ? error.message : "Error retrieving stats" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/profile")
  async createProfile(@Param("id") id: string, @Body() body: any) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) throw new BadRequestException("Invalid ID");

    try {
      const profile = await this.profileService.createProfile({
        ...body,
        userId,
      });
      return {
        status: "success",
        data: profile,
      };
    } catch (error: any) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("already exists")) {
        throw new BadRequestException(message);
      }
      throw new HttpException({ status: "error", message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard("jwt"))
  @Put(":id/profile")
  async updateProfile(@Param("id") id: string, @Body() body: any) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) throw new BadRequestException("Invalid ID");

    try {
      const profile = await this.profileService.updateProfile(userId, body);
      return {
        status: "success",
        data: profile,
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message === "Profile not found") throw new NotFoundException("Profile not found");
      throw new HttpException({ status: "error", message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard("jwt"))
  @Patch(":id/status")
  async updateStatus(@Param("id") id: string, @Body() body: { isActive: boolean }) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) throw new BadRequestException("Invalid ID");

    if (typeof body.isActive !== "boolean") {
      throw new BadRequestException("isActive must be a boolean");
    }

    try {
      const profile = body.isActive
        ? await this.profileService.activateProfile(userId)
        : await this.profileService.deactivateProfile(userId);

      return {
        status: "success",
        data: profile,
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new HttpException({ status: "error", message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(":id/ratings")
  async getStudentRatings(@Param("id") id: string) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      throw new BadRequestException("Invalid ID format");
    }

    try {
      const profile = await this.profileService.getProfile(userId);
      if (!profile) {
        throw new NotFoundException("Profile not found");
      }

      const ratings = await this.sessionRatingService.getRatingsByStudentProfileId(profile.id);
      return {
        status: "success",
        data: ratings,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        { status: "error", message: error instanceof Error ? error.message : "Error retrieving ratings" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
