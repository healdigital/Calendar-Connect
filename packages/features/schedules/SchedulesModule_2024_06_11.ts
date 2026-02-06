import { Module } from "@nestjs/common";
import { SchedulesRepository } from "./repositories/SchedulesRepository";
import { SchedulesService_2024_06_11 } from "./services/SchedulesService_2024_06_11";

@Module({
  imports: [],
  providers: [SchedulesRepository, SchedulesService_2024_06_11],
  exports: [SchedulesRepository, SchedulesService_2024_06_11],
})
export class SchedulesModule_2024_06_11 {}
