import {
  SessionRatingRepository,
  StatisticsService,
  ThotisProfileRepository,
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
        new ThotisProfileRepository({ prismaClient: prisma as any }),
      inject: [PrismaWriteService],
    },
    {
      provide: SessionRatingRepository,
      useFactory: (prisma: PrismaWriteService) =>
        new SessionRatingRepository({ prismaClient: prisma as any }),
      inject: [PrismaWriteService],
    },
    {
      provide: StatisticsService,
      useFactory: (profileRepo: ThotisProfileRepository, ratingRepo: SessionRatingRepository) =>
        new StatisticsService(profileRepo, ratingRepo),
      inject: [ThotisProfileRepository, SessionRatingRepository],
    },
  ],
})
export class PlatformModule {}
