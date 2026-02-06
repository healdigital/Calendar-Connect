import {
  AnalyticsRepository,
  ProfileRepository,
  SessionRatingRepository,
  SessionRatingService,
  StatisticsService,
  ThotisAnalyticsService,
  ThotisBookingService,
  ThotisProfileRepository,
} from "@calcom/platform-libraries";
import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller";
import { BookingsController as BookingsControllerV2 } from "./controllers/bookings.controller";
import { BookingsService } from "./services/bookings.service";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";

@Module({
  imports: [PrismaModule],
  controllers: [BookingsControllerV2],
  providers: [
    BookingsService,
    {
      provide: SessionRatingRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new SessionRatingRepository({ prismaClient: prisma as any }),
      inject: [PrismaWriteService],
    },
    {
      provide: ThotisProfileRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new ThotisProfileRepository({ prismaClient: prisma as any }),
      inject: [PrismaWriteService],
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
        new ThotisBookingService(prisma.prisma as any, undefined, undefined, analytics),
      inject: [PrismaWriteService, ThotisAnalyticsService],
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
    {
      provide: SessionRatingService,
      useFactory: (ratingRepo: SessionRatingRepository) => new SessionRatingService(ratingRepo),
      inject: [SessionRatingRepository],
    },
  ],
})
export class BookingsModule {}
