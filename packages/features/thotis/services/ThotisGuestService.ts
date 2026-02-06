import { createHash, randomBytes } from "node:crypto";
import process from "node:process";
import prisma from "@calcom/prisma";
import { TRPCError } from "@trpc/server";

export class ThotisGuestService {
  private readonly TOKEN_TTL_MINUTES = 15;

  /**
   * Handles rate limiting and token generation.
   */
  async requestInboxLink(email: string, bookingId?: number, ttlMinutes: number = this.TOKEN_TTL_MINUTES) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find or create guest identity
    let guest = await prisma.thotisGuestIdentity.findUnique({
      where: { normalizedEmail },
    });

    if (!guest) {
      guest = await prisma.thotisGuestIdentity.create({
        data: {
          email,
          normalizedEmail,
        },
      });
    }

    if (guest.blocked) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }

    // 2. Rate limiting (simple check based on lastRequestAt)
    // For a more robust solution, we'd check count in last hour, but this is a start as per requirements
    const now = new Date();
    // Use lastRequestAt to prevent spamming every second.
    // If last request was < 1 minute ago, block.
    if (now.getTime() - guest.lastRequestAt.getTime() < 60 * 1000) {
      // Silent failure or error? Let's throw for now to inform UI, or silent to prevent enumeration.
      // Requirement says "Protection rate-limit".
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Please wait before requesting another link",
      });
    }

    // Update last request
    await prisma.thotisGuestIdentity.update({
      where: { id: guest.id },
      data: { lastRequestAt: now },
    });

    const tokenRaw = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(tokenRaw).digest("hex");
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    // 4. Store Token
    await prisma.thotisMagicLinkToken.create({
      data: {
        tokenHash,
        guestId: guest.id,
        bookingId, // Optional scope
        expiresAt,
      },
    });

    // 5. Audit Log
    await this.logAccess(guest.id, "requestInboxLink", "CREATE_TOKEN", null, true);

    // 6. Return raw token for internal use (e.g. cron jobs)
    // Security: This token MUST NOT be returned to the client in public TRPC routes.
    if (process.env.NODE_ENV === "development") {
      console.log(`[ThotisGuestService] Magic link token for ${normalizedEmail}: ${tokenRaw}`);
    }

    return { success: true, token: tokenRaw };
  }

  /**
   * Verify a token and return the guest.
   */
  async verifyToken(tokenRaw: string) {
    const tokenHash = createHash("sha256").update(tokenRaw).digest("hex");

    const magicLink = await prisma.thotisMagicLinkToken.findUnique({
      where: { tokenHash },
      include: { guest: true },
    });

    if (!magicLink) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
    }

    if (magicLink.invalidated || magicLink.usedAt || magicLink.expiresAt < new Date()) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Token expired or used" });
    }

    return magicLink;
  }

  /**
   * Mark token as used (optional, if we want one-time use for login vs session access).
   * For "session access", maybe valid for 15 mins is enough.
   * But for "actions" like cancel, maybe we invalidate after?
   * Requirement: "invalidation token après usage sensible (annulation/replanif)"
   */
  async invalidateToken(tokenId: string) {
    await prisma.thotisMagicLinkToken.update({
      where: { id: tokenId },
      data: { invalidated: true, usedAt: new Date() },
    });
  }

  async logAccess(
    guestId: string | null,
    endpoint: string,
    action: string,
    resourceId: string | null = null,
    success: boolean = true
  ) {
    await prisma.thotisGuestAccessLog.create({
      data: {
        guestId,
        endpoint,
        action,
        resourceId,
        success,
      },
    });
  }
}
