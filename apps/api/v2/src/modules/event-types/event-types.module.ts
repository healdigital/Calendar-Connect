import { Module } from "@nestjs/common";
import { EventTypesRepository } from "./event-types.repository";
import { EventTypeAccessService } from "./services/event-type-access.service";

@Module({
  imports: [],
  controllers: [],
  providers: [EventTypesRepository, EventTypeAccessService],
  exports: [EventTypesRepository, EventTypeAccessService],
})
export class EventTypesModule {}
