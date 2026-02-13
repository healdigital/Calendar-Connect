import type { CreateProfileInput, UpdateProfileInput } from "@calcom/platform-libraries";
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
import { API_VERSIONS_VALUES } from "@/lib/api-versions";

@ApiTags("Students")
@Controller({
  path: "/v2/students",
  version: API_VERSIONS_VALUES,
})
export class StudentsController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly thotisBookingService: ThotisBookingService,
    private readonly statisticsService: StatisticsService,
    private readonly sessionRatingService: SessionRatingService
  ) {}

  @Get("by-field/:field")
  async getStudentsByField(@Param("field") field: string) {
    try {
      const profiles = await this.profileService.getProfilesByField(field);
      return {
        status: "success",
        data: profiles,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Invalid field of study")) {
        throw new BadRequestException(message);
      }
      throw new HttpException({ status: "error", message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(":id")
  async getStudent(@Param("id") id: string) {
    // Try as userId first if it's a number, otherwise as profileId string
    const idAsNumber = parseInt(id, 10);
    const isNumeric = !Number.isNaN(idAsNumber) && String(idAsNumber) === id;

    try {
      const profile = isNumeric
        ? await this.profileService.getProfile(idAsNumber)
        : await this.profileService.getProfileById(id);

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
    const idAsNumber = parseInt(id, 10);
    const isNumeric = !Number.isNaN(idAsNumber) && String(idAsNumber) === id;

    if (!start || !end) {
      throw new BadRequestException("Start and end dates are required");
    }

    try {
      // We need the profile ID, not the user ID, for booking service
      const profile = isNumeric
        ? await this.profileService.getProfile(idAsNumber)
        : await this.profileService.getProfileById(id);

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
    const idAsNumber = parseInt(id, 10);
    const isNumeric = !Number.isNaN(idAsNumber) && String(idAsNumber) === id;

    try {
      // Statistics service works with userId
      let userId = idAsNumber;
      if (!isNumeric) {
        const profile = await this.profileService.getProfileById(id);
        if (!profile) throw new NotFoundException("Profile not found");
        userId = profile.userId;
      }

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
  async createProfile(@Param("id") id: string, @Body() body: CreateProfileInput) {
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId))
      throw new BadRequestException("Profile creation requires a numeric userId as ID");

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
  async updateProfile(@Param("id") id: string, @Body() body: UpdateProfileInput) {
    const idAsNumber = parseInt(id, 10);
    const isNumeric = !Number.isNaN(idAsNumber) && String(idAsNumber) === id;

    try {
      let userId = idAsNumber;
      if (!isNumeric) {
        const profile = await this.profileService.getProfileById(id);
        if (!profile) throw new NotFoundException("Profile not found");
        userId = profile.userId;
      }

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
    const idAsNumber = parseInt(id, 10);
    const isNumeric = !Number.isNaN(idAsNumber) && String(idAsNumber) === id;

    if (typeof body.isActive !== "boolean") {
      throw new BadRequestException("isActive must be a boolean");
    }

    try {
      let userId = idAsNumber;
      if (!isNumeric) {
        const profile = await this.profileService.getProfileById(id);
        if (!profile) throw new NotFoundException("Profile not found");
        userId = profile.userId;
      }

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
    const idAsNumber = parseInt(id, 10);
    const isNumeric = !Number.isNaN(idAsNumber) && String(idAsNumber) === id;

    try {
      const profile = isNumeric
        ? await this.profileService.getProfile(idAsNumber)
        : await this.profileService.getProfileById(id);

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
