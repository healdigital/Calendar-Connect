import {
  AnalyticsRepository,
  ProfileService,
  SessionRatingRepository,
  SessionRatingService,
  StatisticsService,
  ThotisAnalyticsService,
  ThotisBookingService,
  ThotisProfileRepository,
} from "@calcom/platform-libraries";
import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";

@Module({
  imports: [PrismaModule],
  controllers: [StudentsController],
  providers: [
    {
      provide: ThotisProfileRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new ThotisProfileRepository({ prismaClient: prisma as any }),
      inject: [PrismaWriteService],
    },
    {
      provide: ProfileService,
      useFactory: (repo: ThotisProfileRepository) => new ProfileService(repo),
      inject: [ThotisProfileRepository],
    },
    {
      provide: AnalyticsRepository,
      useFactory: (prisma: PrismaWriteService) => new AnalyticsRepository({ prismaClient: prisma as any }),
      inject: [PrismaWriteService],
    },
    {
      provide: ThotisAnalyticsService,
      useFactory: (repo: AnalyticsRepository) => new ThotisAnalyticsService(repo),
      inject: [AnalyticsRepository],
    },
    {
      provide: ThotisBookingService,
      useFactory: (prisma: PrismaWriteService, analytics: ThotisAnalyticsService) =>
        new ThotisBookingService(prisma as any, undefined, undefined, analytics),
      inject: [PrismaWriteService, ThotisAnalyticsService],
    },
    {
      provide: SessionRatingRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new SessionRatingRepository({ prismaClient: prisma as any }),
      inject: [PrismaWriteService],
    },
    {
      provide: SessionRatingService,
      useFactory: (repo: SessionRatingRepository) => new SessionRatingService(repo),
      inject: [SessionRatingRepository],
    },
    {
      provide: StatisticsService,
      useFactory: (
        profileRepo: ThotisProfileRepository,
        ratingRepo: SessionRatingRepository,
        analytics: ThotisAnalyticsService
      ) => new StatisticsService(profileRepo, ratingRepo, analytics),
      inject: [ThotisProfileRepository, SessionRatingRepository, ThotisAnalyticsService],
    },
  ],
})
export class StudentsModule {}
