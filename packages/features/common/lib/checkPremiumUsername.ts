/**
 * Checks if a username is available for premium subscription.
 * OSS stub - always returns available as premium usernames are not implemented.
 *
 * @param username - The username to check
 * @returns Object indicating availability
 */
export async function checkPremiumUsername(username: string): Promise<{
  available: boolean;
  premium: boolean;
  message?: string;
}> {
  // OSS stub - premium usernames are not implemented
  // All usernames are considered available
  return {
    available: true,
    premium: false,
  };
}
