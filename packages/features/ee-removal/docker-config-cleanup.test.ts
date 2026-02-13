import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("Docker configuration cleanup", () => {
  it("should not contain enterprise config on line 98", () => {
    // Feature: ee-removal, Task 31.1
    // Validates: Requirements 5.5
    const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
    const content = fs.readFileSync(dockerComposePath, "utf-8");
    const lines = content.split("\n");

    // Line 98 (0-indexed as 97)
    if (lines.length > 97) {
      expect(lines[97]).not.toContain("STRIPE_PRICE_ID_ENTERPRISE");
      expect(lines[97]).not.toContain("enterprise");
    }
  });

  it("should not contain STRIPE_PRICE_ID_ENTERPRISE anywhere in the file", () => {
    // Feature: ee-removal, Task 31.1
    // Validates: Requirements 5.5
    const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
    const content = fs.readFileSync(dockerComposePath, "utf-8");

    expect(content).not.toContain("STRIPE_PRICE_ID_ENTERPRISE");
    expect(content).not.toContain("STRIPE_PRICE_ID_ENTERPRISE_OVERAGE");
  });

  it("should not contain IS_TEAM_BILLING_ENABLED in the file", () => {
    // Feature: ee-removal, Task 31.1
    // Validates: Requirements 5.5
    const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
    const content = fs.readFileSync(dockerComposePath, "utf-8");

    expect(content).not.toContain("IS_TEAM_BILLING_ENABLED");
  });
});
