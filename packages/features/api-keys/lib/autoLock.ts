// OSS stub for autoLock functionality

export enum LockReason {
  SPAM_WORKFLOW_BODY = "SPAM_WORKFLOW_BODY",
  MALICIOUS_URL_IN_WORKFLOW = "MALICIOUS_URL_IN_WORKFLOW",
}

export async function lockUser(_userIdKey: string, _userId: string, _reason: LockReason): Promise<void> {
  // OSS stub - no-op
  // In production, this would lock the user account
}
