import { hashAPIKey } from "@calcom/features/api-keys/lib/apiKeys";
import prisma from "@calcom/prisma";

/**
 * Validates an API key and returns the key record if valid.
 *
 * @param apiKey - The plain API key to validate
 * @param appId - The app ID to validate against (e.g., "make", "zapier")
 * @returns The API key record if valid, null otherwise
 */
export async function findValidApiKey(apiKey: string, appId: string) {
  if (!apiKey) {
    return null;
  }

  const hashedKey = hashAPIKey(apiKey);

  const validKey = await prisma.apiKey.findUnique({
    where: {
      hashedKey,
    },
    select: {
      id: true,
      userId: true,
      teamId: true,
      appId: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      note: true,
      hashedKey: true,
    },
  });

  if (!validKey) {
    return null;
  }

  // Check if key is expired
  if (validKey.expiresAt && validKey.expiresAt < new Date()) {
    return null;
  }

  // Check if key is for the correct app
  if (validKey.appId && validKey.appId !== appId) {
    return null;
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: {
      id: validKey.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  return validKey;
}

export default findValidApiKey;
