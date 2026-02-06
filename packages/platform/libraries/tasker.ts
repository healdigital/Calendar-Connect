export const CANCEL_USAGE_INCREMENT_JOB_ID = "cancel-usage-increment";
export const getIncrementUsageIdempotencyKey = (id: string) => `increment-usage-${id}`;
export const getIncrementUsageJobTag = (id: string) => `usage-increment-${id}`;
export const INCREMENT_USAGE_JOB_ID = "increment-usage";
export const RESCHEDULE_USAGE_INCREMENT_JOB_ID = "reschedule-usage-increment";
