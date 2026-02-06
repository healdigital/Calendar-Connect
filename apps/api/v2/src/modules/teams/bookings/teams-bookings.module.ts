import { Module } from "@nestjs/common";
import { MembershipsModule } from "@/modules/memberships/memberships.module";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { RedisModule } from "@/modules/redis/redis.module";
import { StripeModule } from "@/modules/stripe/stripe.module";
import { TeamsBookingsController } from "@/modules/teams/bookings/teams-bookings.controller";

@Module({
  imports: [PrismaModule, StripeModule, RedisModule, MembershipsModule],
  controllers: [TeamsBookingsController],
})
export class TeamsBookingsModule {}
