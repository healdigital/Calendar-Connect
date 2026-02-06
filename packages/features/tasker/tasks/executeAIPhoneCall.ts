import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["executeAIPhoneCall"] });

export async function executeAIPhoneCall(_payload: string): Promise<void> {
  log.debug("executeAIPhoneCall disabled for Open Source edition");
}
