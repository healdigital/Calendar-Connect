import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { CalendarsTaskerModule } from "@/lib/modules/calendars-tasker.module";
import { AppsRepository } from "@/modules/apps/apps.repository";
import { CredentialsRepository } from "@/modules/credentials/credentials.repository";
import { OrganizationsDelegationCredentialRepository } from "@/modules/organizations/delegation-credentials/organizations-delegation-credential.repository";
import { OrganizationsDelegationCredentialService } from "@/modules/organizations/delegation-credentials/services/organizations-delegation-credential.service";
import { OrganizationsMembershipRepository } from "@/modules/organizations/memberships/organizations-membership.repository";
import { OrganizationsMembershipService } from "@/modules/organizations/memberships/services/organizations-membership.service";
import { OrganizationsMembershipOutputService } from "@/modules/organizations/memberships/services/organizations-membership-output.service";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { RedisModule } from "@/modules/redis/redis.module";
import { SelectedCalendarsController } from "@/modules/selected-calendars/controllers/selected-calendars.controller";
import { SelectedCalendarsRepository } from "@/modules/selected-calendars/selected-calendars.repository";
import { SelectedCalendarsService } from "@/modules/selected-calendars/services/selected-calendars.service";
import { UsersRepository } from "@/modules/users/users.repository";

@Module({
  imports: [
    PrismaModule,
    RedisModule,

    CalendarsTaskerModule,
  ],
  providers: [
    SelectedCalendarsRepository,

    UsersRepository,
    CredentialsRepository,
    AppsRepository,
    OrganizationsDelegationCredentialService,
    OrganizationsMembershipService,
    OrganizationsMembershipOutputService,
    OrganizationsDelegationCredentialRepository,
    OrganizationsMembershipRepository,
    SelectedCalendarsService,
  ],
  controllers: [SelectedCalendarsController],
  exports: [SelectedCalendarsRepository],
})
export class SelectedCalendarsModule {}
