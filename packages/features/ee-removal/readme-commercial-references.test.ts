import process from "node:process";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("README.md commercial reference removal", () => {
  it("should not contain 'Enterprise Edition' on line 126", () => {
    // Feature: ee-removal, Task 29.1
    // Validates: Requirements 5.2
    const readmePath = path.join(process.cwd(), "README.md");
    const content = fs.readFileSync(readmePath, "utf-8");
    const lines = content.split("\n");

    // Line 126 (0-indexed as 125)
    if (lines.length > 125) {
      expect(lines[125]).not.toContain("Enterprise Edition");
    }
  });

  it("should not contain 'Enterprise Edition' on line 738", () => {
    // Feature: ee-removal, Task 29.1
    // Validates: Requirements 5.2
    const readmePath = path.join(process.cwd(), "README.md");
    const content = fs.readFileSync(readmePath, "utf-8");
    const lines = content.split("\n");

    // Line 738 (0-indexed as 737)
    if (lines.length > 737) {
      expect(lines[737]).not.toContain("Enterprise Edition");
    }
  });

  it("should not contain 'Enterprise Edition' anywhere in the file", () => {
    // Feature: ee-removal, Task 29.1
    // Validates: Requirements 5.2
    const readmePath = path.join(process.cwd(), "README.md");
    const content = fs.readFileSync(readmePath, "utf-8");

    expect(content).not.toContain("Enterprise Edition");
  });
});
