import { Module } from "@nestjs/common";
import { InternalEventTypesController } from "./controllers/internal-event-types.controller";
import { EventTypesRepository } from "./event-types.repository";
// import { EventTypesController } from "./controllers/event-types.controller"; // If exists
import { EventTypeAccessService } from "./services/event-type-access.service";
import { MembershipsModule } from "@/modules/memberships/memberships.module";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { TeamsModule } from "@/modules/teams/teams/teams.module";
import { UsersModule } from "@/modules/users/users.module";

@Module({
  imports: [PrismaModule, UsersModule, MembershipsModule, TeamsModule],
  controllers: [], // Add controllers if you find them in the dir
  providers: [EventTypesRepository, EventTypeAccessService],
  exports: [EventTypesRepository, EventTypeAccessService],
})
export class EventTypesModule {}
