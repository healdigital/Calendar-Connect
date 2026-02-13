import { Module } from "@nestjs/common";
import { EventTypesRepository } from "./event-types.repository";
import { EventTypeAccessService } from "./services/event-type-access.service";
import { MembershipsModule } from "@/modules/memberships/memberships.module";
import { TeamsModule } from "@/modules/teams/teams/teams.module";

@Module({
  imports: [MembershipsModule, TeamsModule],
  controllers: [],
  providers: [EventTypesRepository, EventTypeAccessService],
  exports: [EventTypesRepository, EventTypeAccessService],
})
export class EventTypesModule {}
