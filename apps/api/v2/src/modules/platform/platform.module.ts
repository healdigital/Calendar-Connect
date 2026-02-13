import {
  SessionRatingRepository,
  StatisticsService,
  ThotisProfileRepository,
  AnalyticsRepository,
  ThotisAnalyticsService,
} from "@calcom/platform-libraries";
import { Module } from "@nestjs/common";
import { PlatformController } from "./platform.controller";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";

@Module({
  imports: [PrismaModule],
  controllers: [PlatformController],
  providers: [
    {
      provide: ThotisProfileRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new ThotisProfileRepository({ prismaClient: prisma.prisma }),
      inject: [PrismaWriteService],
    },
    {
      provide: SessionRatingRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new SessionRatingRepository({ prismaClient: prisma.prisma }),
      inject: [PrismaWriteService],
    },
    {
      provide: AnalyticsRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new AnalyticsRepository({ prismaClient: prisma.prisma }),
      inject: [PrismaWriteService],
    },
    {
      provide: ThotisAnalyticsService,
      useClass: ThotisAnalyticsService,
    },
    {
      provide: StatisticsService,
      useFactory: (
        profileRepo: ThotisProfileRepository,
        ratingRepo: SessionRatingRepository,
        analyticsService: ThotisAnalyticsService
      ) => new StatisticsService(profileRepo, ratingRepo, analyticsService),
      inject: [ThotisProfileRepository, SessionRatingRepository, ThotisAnalyticsService],
    },
  ],
})
export class PlatformModule {}
