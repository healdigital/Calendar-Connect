import { Module } from "@nestjs/common";
import { AppsRepository } from "@/modules/apps/apps.repository";
import { CalUnifiedCalendarsController } from "@/modules/cal-unified-calendars/controllers/cal-unified-calendars.controller";
import { GoogleCalendarService } from "@/modules/cal-unified-calendars/services/google-calendar.service";
import { CredentialsRepository } from "@/modules/credentials/credentials.repository";
import { PrismaReadService } from "@/modules/prisma/prisma-read.service";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";
import { RedisModule } from "@/modules/redis/redis.module";
import { SelectedCalendarsRepository } from "@/modules/selected-calendars/selected-calendars.repository";
import { TokensModule } from "@/modules/tokens/tokens.module";
import { UsersRepository } from "@/modules/users/users.repository";

@Module({
  imports: [TokensModule, RedisModule],
  providers: [
    GoogleCalendarService,
    AppsRepository,
    CredentialsRepository,
    SelectedCalendarsRepository,
    PrismaReadService,
    PrismaWriteService,
    UsersRepository,
  ],
  controllers: [CalUnifiedCalendarsController],
  exports: [GoogleCalendarService],
})
export class CalUnifiedCalendarsModule {}
