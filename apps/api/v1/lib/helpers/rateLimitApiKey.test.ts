import { checkRateLimitAndThrowError } from "@calcom/lib/checkRateLimitAndThrowError";
import { HttpError } from "@calcom/lib/http-error";
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { describe, expect, it, vi } from "vitest";
import { rateLimitApiKey } from "./rateLimitApiKey";

vi.mock("@calcom/lib/checkRateLimitAndThrowError", () => ({
  checkRateLimitAndThrowError: vi.fn(),
}));

describe("rateLimitApiKey middleware", () => {
  const testUserId = 123;
  const testApiKey = "test-api-key";

  it("should return 401 if userId is missing", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
      query: { apiKey: testApiKey },
    });

    await rateLimitApiKey(req, res, vi.fn() as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: "No userId provided" });
  });

  it("should return 401 if apiKey is missing", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
    });

    req.userId = testUserId;

    await rateLimitApiKey(req, res, vi.fn() as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ message: "No apiKey provided" });
  });

  it("should set rate limit headers on successful rate limit check", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
      query: { apiKey: testApiKey },
    });

    req.userId = testUserId;

    vi.mocked(checkRateLimitAndThrowError).mockImplementation(async ({ onRateLimiterResponse }) => {
      if (onRateLimiterResponse) {
        await onRateLimiterResponse({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 60000,
        });
      }
      return {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      };
    });

    const next = vi.fn();

    await rateLimitApiKey(req, res, next);

    expect(res.getHeader("X-RateLimit-Limit")).toBe(100);
    expect(res.getHeader("X-RateLimit-Remaining")).toBe(99);
    expect(res.getHeader("X-RateLimit-Reset")).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it("should return 429 if rate limit is exceeded", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
      query: { apiKey: testApiKey },
    });

    req.userId = testUserId;

    vi.mocked(checkRateLimitAndThrowError).mockRejectedValueOnce(
      new HttpError({ statusCode: 429, message: "Rate limit exceeded" })
    );

    await rateLimitApiKey(req, res, vi.fn() as any);

    expect(res._getStatusCode()).toBe(429);
    expect(JSON.parse(res._getData())).toEqual({ message: "Rate limit exceeded" });
  });

  it("should handle generic errors with 429 status", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
      query: { apiKey: testApiKey },
    });

    req.userId = testUserId;

    vi.mocked(checkRateLimitAndThrowError).mockRejectedValueOnce(new Error("Generic error"));

    await rateLimitApiKey(req, res, vi.fn() as any);

    expect(res._getStatusCode()).toBe(429);
    expect(JSON.parse(res._getData())).toEqual({ message: "Rate limit exceeded" });
  });
});
