import { checkRateLimitAndThrowError } from "@calcom/lib/checkRateLimitAndThrowError";
import { HttpError } from "@calcom/lib/http-error";
import type { NextMiddleware } from "next-api-middleware";

export const rateLimitApiKey: NextMiddleware = async (req, res, next) => {
  if (!req.userId) return res.status(401).json({ message: "No userId provided" });
  if (!req.query.apiKey) return res.status(401).json({ message: "No apiKey provided" });

  // TODO: Add a way to add trusted api keys
  try {
    const identifier = req.userId.toString();
    await checkRateLimitAndThrowError({
      identifier,
      rateLimitingType: "api",
      onRateLimiterResponse: async (response) => {
        res.setHeader("X-RateLimit-Limit", response.limit);
        res.setHeader("X-RateLimit-Remaining", response.remaining);
        res.setHeader("X-RateLimit-Reset", response.reset);
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(429).json({ message: "Rate limit exceeded" });
  }

  await next();
};
