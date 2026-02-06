import fs from "fs";
import path from "path";
import { glob } from "glob";

/**
 * Property-Based Tests for EE Removal - API v2
 * Feature: ee-removal
 */
describe("Property Tests: API v2 EE Removal", () => {
  /**
   * Property 1: No EE Imports in Codebase (API v2 scope)
   * Feature: ee-removal, Property 1: No EE Imports in Codebase
   *
   * **Validates: Requirements 1.2, 3.1**
   *
   * For any TypeScript or JavaScript file in the API v2 application,
   * the file should not contain import statements matching the patterns
   * `@/ee`, `@calcom/features/ee`, or `@calcom/ee`
   */
  it("Property 1: No EE imports in API v2 codebase", async () => {
    // Get all TypeScript and JavaScript files in the API v2 application
    const apiV2Path = path.join(process.cwd(), "apps/api/v2/src");
    const files = await glob("**/*.{ts,tsx,js,jsx}", {
      cwd: apiV2Path,
      ignore: [
        "node_modules/**",
        "dist/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/*.property.test.{ts,tsx}",
      ],
      absolute: true,
    });

    // Define EE import patterns to check for
    const eeImportPatterns = [
      /@\/ee[\/'"]/,
      /@calcom\/features\/ee[\/'"]/,
      /@calcom\/ee[\/'"]/,
    ];

    // Track any violations found
    const violations: Array<{ file: string; line: number; content: string }> = [];

    // Check each file for EE imports
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        for (const pattern of eeImportPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      });
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationMessage = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join("\n\n");
      throw new Error(
        `Found ${violations.length} EE import(s) in API v2:\n\n${violationMessage}`
      );
    }

    expect(violations).toHaveLength(0);
  }, 30000);
});
