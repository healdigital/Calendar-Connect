import process from "node:process";
import { hashAPIKey } from "@calcom/features/api-keys/lib/apiKeys";
import { prisma } from "@calcom/prisma";
import type { NextMiddleware } from "next-api-middleware";
import { isAdminGuard } from "../utils/isAdmin";
import { isLockedOrBlocked } from "../utils/isLockedOrBlocked";
import { ScopeOfAdmin } from "../utils/scopeOfAdmin";

// This verifies the apiKey and sets the user if it is valid.
export const verifyApiKey: NextMiddleware = async (req, res, next) => {
  if (!req.query.apiKey) return res.status(401).json({ message: "No apiKey provided" });

  const strippedApiKey = `${req.query.apiKey}`.replace(process.env.API_KEY_PREFIX || "cal_", "");
  const hashedKey = hashAPIKey(strippedApiKey);

  // Verify API key from database
  const apiKey = await prisma.apiKey.findUnique({
    where: {
      hashedKey,
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          uuid: true,
          email: true,
          username: true,
          name: true,
          role: true,
          locked: true,
          disableImpersonation: true,
        },
      },
    },
  });

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Check if key is expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return res.status(401).json({ error: "API key has expired" });
  }

  if (!apiKey.user) {
    return res.status(401).json({ error: "API key has no associated user" });
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: {
      id: apiKey.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  // Save the user id and uuid in the request for later use
  req.userId = apiKey.userId;
  req.userUuid = apiKey.user.uuid;
  req.user = apiKey.user;

  const { isAdmin, scope } = await isAdminGuard(req);
  const userIsLockedOrBlocked = await isLockedOrBlocked(req);

  if (userIsLockedOrBlocked)
    return res.status(403).json({ error: "You are not authorized to perform this request." });

  req.isSystemWideAdmin = isAdmin && scope === ScopeOfAdmin.SystemWide;
  req.isOrganizationOwnerOrAdmin = isAdmin && scope === ScopeOfAdmin.OrgOwnerOrAdmin;

  await next();
};
