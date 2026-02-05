import { createHmac } from "crypto";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { type BaseWebhookPayload, WebhookService } from "./WebhookService";

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe("WebhookService Property Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("Property 27: Webhook Payload Signature - Validates Requirement 10.5", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10 }), // Secret
        fc.constantFrom("booking.created", "booking.cancelled", "booking.completed", "booking.rescheduled"), // Event type
        fc.dictionary(fc.string(), fc.string()), // Payload data
        (secret, eventType, payloadData) => {
          const service = new WebhookService({
            url: "https://example.com/webhook",
            secret,
          });

          // Mock fetch to capture request
          globalFetch.mockResolvedValue({
            ok: true,
            status: 200,
          });

          // Manually construct payload to verify signature logic matches
          const payload: BaseWebhookPayload = {
            event: eventType as any,
            createdAt: new Date().toISOString(),
            payload: payloadData,
          };

          // Generate signature using service method
          const signature = service.generateSignature(payload);

          // Verify signature matches manual calculation
          const expectedSignature = createHmac("sha256", secret)
            .update(JSON.stringify(payload))
            .digest("hex");

          return signature === expectedSignature;
        }
      )
    );
  });

  test("Property 28: Webhook Event Types - Validates Requirements 10.1, 10.2, 10.3", async () => {
    // Valid event types
    const validEvents = ["booking.created", "booking.cancelled", "booking.completed", "booking.rescheduled"];

    const service = new WebhookService({
      url: "https://example.com/test",
      secret: "test_secret",
    });

    globalFetch.mockResolvedValue({ ok: true });

    // Check booking.created
    await service.sendBookingCreated({} as any);
    let callArgs = globalFetch.mock.calls[0];
    let body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe("booking.created");

    // Check booking.cancelled
    await service.sendBookingCancelled({} as any);
    callArgs = globalFetch.mock.calls[1];
    body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe("booking.cancelled");

    // Check booking.completed
    await service.sendBookingCompleted({} as any);
    callArgs = globalFetch.mock.calls[2];
    body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe("booking.completed");

    // Check booking.rescheduled
    await service.sendBookingRescheduled({} as any);
    callArgs = globalFetch.mock.calls[3];
    body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe("booking.rescheduled");
  });

  test("Property 29: Webhook Retry Exponential Backoff - Validates Requirement 10.4", async () => {
    // We manually test the backoff logic by mocking fetch to fail
    const service = new WebhookService({
      url: "https://example.com/fail",
      secret: "test_secret",
    });

    // Mock fetch to always fail
    globalFetch.mockRejectedValue(new Error("Network Error"));

    const delays = [1000, 2000, 4000];
    const retrySpy = vi.spyOn(service, "retryFailedWebhook");

    // We need to spy on setTimeout to verify delays
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");

    // Start the process (don't await yet, as it will pause)
    const promise = service.sendBookingCreated({} as any);

    // Advance timers to trigger retries
    // Expected flow:
    // 1. Initial call (fails)
    // 2. Wait 1000ms
    // 3. Retry 1 (fails)
    // 4. Wait 2000ms
    // 5. Retry 2 (fails)
    // 6. Wait 4000ms
    // 7. Retry 3 (fails)
    // 8. Give up

    // We run all timers to completion
    await vi.runAllTimersAsync();

    // Wait for promise to settle
    await promise;

    // Verify calls
    expect(globalFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(retrySpy).toHaveBeenCalled();

    // Verify delays - checking if setTimeout was called with correct delays
    // Note: setTimeout is also used for the abort controller (5000ms)
    // So we filter for our backoff delays
    const timeoutCalls = setTimeoutSpy.mock.calls.map((args) => args[1]);
    expect(timeoutCalls).toContain(1000);
    expect(timeoutCalls).toContain(2000);
    expect(timeoutCalls).toContain(4000);
  });
});
