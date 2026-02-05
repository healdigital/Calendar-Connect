import { StatisticsService } from "@calcom/platform-libraries";
import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Platform")
@Controller("platform")
export class PlatformController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("stats")
  async getPlatformStats() {
    try {
      const stats = await this.statisticsService.getPlatformStats();
      return {
        status: "success",
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: "error",
          message: error instanceof Error ? error.message : "Error retrieving platform stats",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
