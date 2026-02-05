import { getTasker, type Tasker } from "@calcom/platform-libraries";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TaskerService {
  private readonly tasker: Tasker;

  constructor() {
    this.tasker = getTasker();
  }

  getTasker(): Tasker {
    return this.tasker;
  }
}
