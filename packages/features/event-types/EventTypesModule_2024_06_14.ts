import { Module } from "@nestjs/common";
import { EventTypesRepository_2024_06_14 } from "./repositories/EventTypesRepository_2024_06_14";
import { EventTypesService_2024_06_14 } from "./services/EventTypesService_2024_06_14";

/**
 * EventTypesModule_2024_06_14
 *
 * NestJS module for event types (2024-06-14 API version)
 */
@Module({
  imports: [],
  providers: [EventTypesRepository_2024_06_14, EventTypesService_2024_06_14],
  exports: [EventTypesRepository_2024_06_14, EventTypesService_2024_06_14],
})
export class EventTypesModule_2024_06_14 {}
