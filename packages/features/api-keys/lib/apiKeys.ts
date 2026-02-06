import { createHash, randomBytes } from "node:crypto";

/**
 * Generates a unique API key pair consisting of a hashed key for storage
 * and a plain key to return to the user.
 *
 * @returns A tuple of [hashedKey, plainKey] where:
 *   - hashedKey: SHA256 hash of the key for secure storage in the database
 *   - plainKey: The raw key to be shown to the user (only displayed once)
 */
export function generateUniqueAPIKey(): [string, string] {
  // Generate a cryptographically secure random key (32 bytes = 256 bits)
  const plainKey = randomBytes(32).toString("hex");

  // Hash the key for secure storage
  const hashedKey = hashAPIKey(plainKey);

  return [hashedKey, plainKey];
}

/**
 * Hashes an API key using SHA256 for secure storage.
 *
 * @param apiKey - The plain API key to hash
 * @returns The SHA256 hash of the API key in hexadecimal format
 */
export function hashAPIKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}
