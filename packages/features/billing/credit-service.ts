/**
 * CreditService - OSS stub for billing credit operations.
 * Billing credits are not implemented in the OSS version.
 */
export class CreditService {
  /**
   * Deducts credits for a booking.
   * OSS stub - no-op.
   */
  static async deductCreditsForBooking(params: {
    bookingId: number;
    userId: number;
    eventTypeId: number;
  }): Promise<void> {
    // OSS stub - no-op
  }

  /**
   * Refunds credits for a cancelled booking.
   * OSS stub - no-op.
   */
  static async refundCreditsForBooking(params: { bookingId: number; userId: number }): Promise<void> {
    // OSS stub - no-op
  }

  /**
   * Gets credit balance for a user.
   * OSS stub - returns 0.
   */
  static async getCreditBalance(userId: number): Promise<number> {
    return 0;
  }

  /**
   * Checks if a user has available credits.
   * OSS stub - returns true.
   */
  async hasAvailableCredits(userId: number): Promise<boolean> {
    return true;
  }
}
