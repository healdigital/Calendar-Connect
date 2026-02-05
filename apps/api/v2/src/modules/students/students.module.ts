import {
  ProfileService,
  SessionRatingRepository,
  SessionRatingService,
  StatisticsService,
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
      provide: ThotisBookingService,
      useFactory: (prisma: PrismaWriteService) => new ThotisBookingService(prisma as any),
      inject: [PrismaWriteService],
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
      useFactory: (profileRepo: ThotisProfileRepository, ratingRepo: SessionRatingRepository) =>
        new StatisticsService(profileRepo, ratingRepo),
      inject: [ThotisProfileRepository, SessionRatingRepository],
    },
  ],
})
export class StudentsModule {}
