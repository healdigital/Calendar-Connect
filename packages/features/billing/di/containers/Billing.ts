/**
 * Billing provider service - OSS stub.
 * Billing providers are not implemented in the OSS version.
 */

export interface BillingProviderService {
  getCustomerAndCheckoutSession(): Promise<any>;
  getCheckoutSession(checkoutSessionId: string): Promise<any>;
  getCustomer(customerId: string): Promise<any>;
}

/**
 * Gets the billing provider service.
 * OSS stub - returns a no-op service.
 */
export function getBillingProviderService(): BillingProviderService {
  return {
    async getCustomerAndCheckoutSession() {
      return null;
    },
    async getCheckoutSession() {
      return { customer: null };
    },
    async getCustomer() {
      return { deleted: false };
    },
  };
}
