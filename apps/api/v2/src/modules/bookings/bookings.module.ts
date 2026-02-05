import {
  ProfileRepository,
  SessionRatingRepository,
  SessionRatingService,
  StatisticsService,
  ThotisProfileRepository,
} from "@calcom/platform-libraries";
import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";

@Module({
  imports: [PrismaModule],
  controllers: [BookingsController],
  providers: [
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
      provide: StatisticsService,
      useFactory: (profileRepo: ThotisProfileRepository, ratingRepo: SessionRatingRepository) =>
        new StatisticsService(profileRepo, ratingRepo),
      inject: [ThotisProfileRepository, SessionRatingRepository],
    },
    {
      provide: SessionRatingService,
      useFactory: (ratingRepo: SessionRatingRepository) => new SessionRatingService(ratingRepo),
      inject: [SessionRatingRepository],
    },
  ],
})
export class BookingsModule {}
