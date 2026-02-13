import process from "node:process";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("common.json commercial reference removal", () => {
  it("should not contain commercial references on line 314", () => {
    // Feature: ee-removal, Task 30.1
    // Validates: Requirements 5.4
    const commonJsonPath = path.join(process.cwd(), "apps/web/public/static/locales/en/common.json");
    const content = fs.readFileSync(commonJsonPath, "utf-8");
    const lines = content.split("\n");

    // Line 314 (0-indexed as 313)
    if (lines.length > 313) {
      const line = lines[313].toLowerCase();
      expect(line).not.toContain("enterprise edition");
      expect(line).not.toContain("commercial license");
      expect(line).not.toContain("enterprise");
      expect(line).not.toContain("commercial");
    }
  });

  it("should not contain 'Enterprise Edition' anywhere in the file", () => {
    // Feature: ee-removal, Task 30.1
    // Validates: Requirements 5.4
    const commonJsonPath = path.join(process.cwd(), "apps/web/public/static/locales/en/common.json");
    const content = fs.readFileSync(commonJsonPath, "utf-8");

    expect(content).not.toContain("Enterprise Edition");
    expect(content).not.toContain("enterprise edition");
  });

  it("should not contain 'commercial license' anywhere in the file", () => {
    // Feature: ee-removal, Task 30.1
    // Validates: Requirements 5.4
    const commonJsonPath = path.join(process.cwd(), "apps/web/public/static/locales/en/common.json");
    const content = fs.readFileSync(commonJsonPath, "utf-8");

    expect(content).not.toContain("commercial license");
    expect(content).not.toContain("Commercial License");
  });

  it("should be valid JSON", () => {
    // Feature: ee-removal, Task 30.1
    // Validates: Requirements 5.4
    const commonJsonPath = path.join(process.cwd(), "apps/web/public/static/locales/en/common.json");
    const content = fs.readFileSync(commonJsonPath, "utf-8");

    expect(() => JSON.parse(content)).not.toThrow();
  });
});
