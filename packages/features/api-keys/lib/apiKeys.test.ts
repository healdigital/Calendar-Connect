import { describe, it, expect } from "vitest";
import { generateUniqueAPIKey, hashAPIKey } from "./apiKeys";

describe("API Key Generation", () => {
  describe("generateUniqueAPIKey", () => {
    it("should produce valid keys with correct format", () => {
      const [hashedKey, plainKey] = generateUniqueAPIKey();

      // Both keys should be 64 character hex strings
      expect(hashedKey).toMatch(/^[a-f0-9]{64}$/);
      expect(plainKey).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should produce different hashed and plain keys", () => {
      const [hashedKey, plainKey] = generateUniqueAPIKey();

      // The hashed key should not equal the plain key
      expect(hashedKey).not.toBe(plainKey);
    });

    it("should produce unique keys on multiple calls", () => {
      const [hashedKey1, plainKey1] = generateUniqueAPIKey();
      const [hashedKey2, plainKey2] = generateUniqueAPIKey();

      // Each call should produce different keys
      expect(plainKey1).not.toBe(plainKey2);
      expect(hashedKey1).not.toBe(hashedKey2);
    });

    it("should produce hashed key that matches manual hash of plain key", () => {
      const [hashedKey, plainKey] = generateUniqueAPIKey();

      // Manually hashing the plain key should produce the same hashed key
      const manualHash = hashAPIKey(plainKey);
      expect(hashedKey).toBe(manualHash);
    });
  });

  describe("hashAPIKey", () => {
    it("should produce deterministic hashes", () => {
      const testKey = "test-api-key-12345";

      const hash1 = hashAPIKey(testKey);
      const hash2 = hashAPIKey(testKey);

      // Same input should always produce same hash
      expect(hash1).toBe(hash2);
    });

    it("should produce 64 character hex string", () => {
      const testKey = "test-api-key-12345";
      const hash = hashAPIKey(testKey);

      // SHA256 hash should be 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = hashAPIKey("key1");
      const hash2 = hashAPIKey("key2");

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash2);
    });
  });
});
