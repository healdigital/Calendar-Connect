import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { describe, expect, it } from "vitest";

/**
 * Property-Based Tests for License Environment Variable Removal
 * Feature: ee-removal
 */
describe("Property Tests: License Environment Variable Absence", () => {
  /**
   * Property 3: No License Environment Variables
   * Feature: ee-removal, Property 3: No License Environment Variables
   *
   * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
   *
   * For any environment configuration file (.env.example, .env.appStore.example, documentation),
   * the file should not contain references to `CALCOM_LICENSE_KEY` or `GET_LICENSE_KEY_URL`
   */
  it("Property 3: No license environment variables", { timeout: 60000 }, async () => {
    // Get all environment configuration files and documentation
    const files = await glob(
      "**/{.env.example,.env.*.example,*.md,*.mdx,docker-compose.yml,docker-compose.yaml}",
      {
        cwd: process.cwd(),
        ignore: [
          "node_modules/**",
          ".next/**",
          "dist/**",
          ".turbo/**",
          "build/**",
          "coverage/**",
          ".git/**",
          ".kiro/specs/**", // Ignore spec files that document the removal
          "AUDIT_*.md", // Ignore audit reports that mention removed env vars as historical context
          "**/*.property.test.{ts,tsx}",
          "**/*.test.{ts,tsx}",
          "**/*.spec.{ts,tsx}",
        ],
        absolute: true,
        dot: true, // Include dotfiles like .env.example
      }
    );

    // Define license environment variables to check for
    const licenseEnvVars = ["CALCOM_LICENSE_KEY", "GET_LICENSE_KEY_URL"];

    // Track any violations found
    const violations: Array<{ file: string; line: number; content: string; variable: string }> = [];

    // Check each file for license environment variables
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        for (const variable of licenseEnvVars) {
          if (line.includes(variable)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              content: line.trim(),
              variable,
            });
          }
        }
      });
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationMessage = violations
        .map((v) => `  ${v.file}:${v.line} (${v.variable})\n    ${v.content}`)
        .join("\n\n");
      throw new Error(
        `Found ${violations.length} license environment variable reference(s):\n\n${violationMessage}`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
