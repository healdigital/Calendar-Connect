import { Module } from "@nestjs/common";
import { DeploymentsService } from "./deployments.service";

@Module({
  providers: [DeploymentsService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
