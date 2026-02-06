import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { describe, expect, it } from "vitest";

/**
 * Property-Based Tests for License Symbol Removal
 * Feature: ee-removal
 */
describe("Property Tests: License Symbol Absence", () => {
  /**
   * Property 2: No License Symbols in Codebase
   * Feature: ee-removal, Property 2: No License Symbols in Codebase
   *
   * **Validates: Requirements 2.1, 2.3**
   *
   * For any file in the repository, the file should not contain references to
   * `LicenseKeySingleton`, `validateLicense`, or `updateLicense`
   */
  it("Property 2: No license symbols in codebase", { timeout: 60000 }, async () => {
    // Get all TypeScript, JavaScript, and related files in the repository
    const files = await glob("**/*.{ts,tsx,js,jsx,json,md}", {
      cwd: process.cwd(),
      ignore: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        ".turbo/**",
        "build/**",
        "coverage/**",
        "**/*.property.test.{ts,tsx}",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        ".git/**",
        ".kiro/specs/**", // Ignore spec files that document the removal
      ],
      absolute: true,
    });

    // Define license symbols to check for
    const licenseSymbols = ["LicenseKeySingleton", "validateLicense", "updateLicense"];

    // Track any violations found
    const violations: Array<{ file: string; line: number; content: string; symbol: string }> = [];

    // Check each file for license symbols
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        for (const symbol of licenseSymbols) {
          if (line.includes(symbol)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              content: line.trim(),
              symbol,
            });
          }
        }
      });
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationMessage = violations
        .map((v) => `  ${v.file}:${v.line} (${v.symbol})\n    ${v.content}`)
        .join("\n\n");
      throw new Error(
        `Found ${violations.length} license symbol reference(s) in codebase:\n\n${violationMessage}`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
