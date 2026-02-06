import { Module } from "@nestjs/common";
import { MembershipsModule } from "@/modules/memberships/memberships.module";
import { OrganizationsRepository } from "@/modules/organizations/index/organizations.repository";
import { OrganizationsTeamsRepository } from "@/modules/organizations/teams/index/organizations-teams.repository";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { RedisModule } from "@/modules/redis/redis.module";
import { StripeModule } from "@/modules/stripe/stripe.module";

@Module({
  imports: [PrismaModule, StripeModule, RedisModule, MembershipsModule],
  providers: [OrganizationsRepository, OrganizationsTeamsRepository],
  controllers: [],
})
export class OrganizationsTeamsBookingsModule {}
