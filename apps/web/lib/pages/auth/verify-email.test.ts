import { describe, expect, it, vi } from "vitest";

// TODO: This test passes but coverage is very low.
vi.mock("@calcom/prisma", () => {
  return {
    prisma: vi.fn(),
  };
});

vi.mock("@calcom/features/ee/billing/stripe-billing-service", () => {
  return {
    StripeBillingService: vi.fn(),
  };
});

describe("verify-email", () => {
  it("should have tests for verify-email handler", () => {
    // Basic test to avoid empty describe block
    expect(true).toBe(true);
  });
});
