import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { CALENDARS_QUEUE } from "@calcom/platform-libraries";
import { OrganizationsDelegationCredentialService } from "./services/organizations-delegation-credential.service";
import { CalendarsTaskerModule } from "@/lib/modules/calendars-tasker.module";
import { MembershipsModule } from "@/modules/memberships/memberships.module";
import { OrganizationsDelegationCredentialController } from "@/modules/organizations/delegation-credentials/organizations-delegation-credential.controller";
import { OrganizationsDelegationCredentialRepository } from "@/modules/organizations/delegation-credentials/organizations-delegation-credential.repository";
import { OrganizationsRepository } from "@/modules/organizations/index/organizations.repository";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { RedisModule } from "@/modules/redis/redis.module";
import { StripeModule } from "@/modules/stripe/stripe.module";

@Module({
  imports: [
    PrismaModule,
    StripeModule,
    RedisModule,
    MembershipsModule,
    BullModule.registerQueue({
      name: CALENDARS_QUEUE,
      limiter: {
        max: 1,
        duration: 1000,
      },
    }),
    CalendarsTaskerModule,
  ],
  providers: [
    OrganizationsDelegationCredentialService,
    OrganizationsDelegationCredentialRepository,
    OrganizationsRepository,
  ],
  controllers: [OrganizationsDelegationCredentialController],
  exports: [
    OrganizationsDelegationCredentialRepository,
    OrganizationsDelegationCredentialService,
    BullModule,
  ],
})
export class OrganizationsDelegationCredentialModule {}
