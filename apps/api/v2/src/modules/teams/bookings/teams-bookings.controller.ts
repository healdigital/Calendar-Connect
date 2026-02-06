import { BadRequestException, Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags as DocsTags } from "@nestjs/swagger";
import { API_VERSIONS_VALUES } from "@/lib/api-versions";
import { API_KEY_HEADER } from "@/lib/docs/headers";
import { ApiAuthGuard } from "@/modules/auth/guards/api-auth/api-auth.guard";
import { RolesGuard } from "@/modules/auth/guards/roles/roles.guard";

@Controller({
  path: "/v2/teams/:teamId/bookings",
  version: API_VERSIONS_VALUES,
})
@UseGuards(ApiAuthGuard, RolesGuard)
@DocsTags("Teams / Bookings")
@ApiHeader(API_KEY_HEADER)
export class TeamsBookingsController {
  @Get("/")
  @ApiOperation({ summary: "Get team bookings" })
  @HttpCode(HttpStatus.OK)
  async getAllTeamBookings() {
    throw new BadRequestException("Team bookings management is not available in this build.");
  }
}
