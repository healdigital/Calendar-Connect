import { Module } from "@nestjs/common";
import { MembershipsModule } from "@/modules/memberships/memberships.module";
import { OrganizationsRepository } from "@/modules/organizations/index/organizations.repository";
import { OrganizationUsersBookingsService } from "@/modules/organizations/users/bookings/services/organization-users-bookings.service";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { RedisModule } from "@/modules/redis/redis.module";
import { StripeModule } from "@/modules/stripe/stripe.module";
import { UsersModule } from "@/modules/users/users.module";

@Module({
  imports: [UsersModule, PrismaModule, StripeModule, RedisModule, MembershipsModule],
  providers: [OrganizationUsersBookingsService, OrganizationsRepository],
  controllers: [],
})
export class OrganizationsUsersBookingsModule {}
