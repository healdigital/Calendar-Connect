import type { ERROR_STATUS, SUCCESS_STATUS } from "@calcom/platform-constants";
import { ApiProperty } from "@nestjs/swagger";

/**
 * CreatePhoneCallOutput
 *
 * Output type for phone call creation response
 */
export class CreatePhoneCallOutput {
  @ApiProperty({
    description: "Status of the operation",
    example: "success",
  })
  status!: typeof SUCCESS_STATUS | typeof ERROR_STATUS;

  @ApiProperty({
    description: "The created booking data",
  })
  data!: {
    id: number;
    uid: string;
    title: string;
    startTime: string;
    endTime: string;
  };
}
