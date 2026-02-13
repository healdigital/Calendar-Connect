import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { describe, expect, it } from "vitest";

/**
 * Property-Based Tests for Commercial Text Removal
 * Feature: ee-removal
 */
describe("Property Tests: Commercial Text Absence", () => {
  /**
   * Property 4: No Commercial Text in User-Facing Files
   * Feature: ee-removal, Property 4: No Commercial Text in User-Facing Files
   *
   * **Validates: Requirements 10.1, 10.2**
   *
   * For any UI component file or translation file, the file should not contain
   * the strings "Enterprise Edition" or "commercial license"
   */
  it("Property 4: No commercial text in user-facing files", { timeout: 60000 }, async () => {
    // Get all user-facing files: UI components and translation files
    const files = await glob("**/*.{tsx,jsx,json}", {
      cwd: process.cwd(),
      ignore: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        ".turbo/**",
        "build/**",
        "coverage/**",
        "**/*.property.test.{ts,tsx}",
        "**/*.test.{ts,tsx,jsx}",
        "**/*.spec.{ts,tsx,jsx}",
        ".git/**",
        ".kiro/specs/**", // Ignore spec files that document the removal
        "package.json", // Ignore package.json files
        "tsconfig.json", // Ignore TypeScript config files
        "**/tsconfig*.json",
        "turbo.json", // Ignore turbo config
        ".changeset/**", // Ignore changeset files
      ],
      absolute: true,
    });

    // Define commercial text patterns to check for (case-insensitive)
    const commercialTextPatterns = [
      { pattern: /enterprise\s+edition/i, name: "Enterprise Edition" },
      { pattern: /commercial\s+license/i, name: "commercial license" },
    ];

    // Track any violations found
    const violations: Array<{ file: string; line: number; content: string; match: string }> = [];

    // Check each file for commercial text
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        for (const { pattern, name } of commercialTextPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              content: line.trim(),
              match: name,
            });
          }
        }
      });
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationMessage = violations
        .map((v) => `  ${v.file}:${v.line} (${v.match})\n    ${v.content}`)
        .join("\n\n");
      throw new Error(
        `Found ${violations.length} commercial text reference(s) in user-facing files:\n\n${violationMessage}`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
