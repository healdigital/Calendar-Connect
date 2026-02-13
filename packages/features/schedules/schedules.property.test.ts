import process from "node:process";
import fs from "fs";
import { glob } from "glob";
import path from "path";
import { describe, expect, it } from "vitest";

/**
 * Property-Based Tests for EE Removal - Schedules Module
 * Feature: ee-removal
 */
describe("Property Tests: Schedules Module EE Removal", () => {
  /**
   * Property 1: No EE Imports in Codebase
   * Feature: ee-removal, Property 1: No EE Imports in Codebase
   *
   * **Validates: Requirements 1.2, 3.1**
   *
   * For any TypeScript or JavaScript file in the schedules module,
   * the file should not contain import statements matching the patterns
   * `@/ee`, `@calcom/features/ee`, or `@calcom/ee`
   */
  it("Property 1: No EE imports in schedules module", async () => {
    // Get all TypeScript and JavaScript files in the schedules module
    const schedulesModulePath = path.join(process.cwd(), "packages/features/schedules");
    const files = await glob("**/*.{ts,tsx,js,jsx}", {
      cwd: schedulesModulePath,
      ignore: ["node_modules/**", "dist/**", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      absolute: true,
    });

    // Define EE import patterns to check for
    const eeImportPatterns = [/@\/ee[/'"]/, /@calcom\/features\/ee[/'"]/, /@calcom\/ee[/'"]/];

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
      const violationMessage = violations.map((v) => `  ${v.file}:${v.line}\n    ${v.content}`).join("\n\n");
      throw new Error(`Found ${violations.length} EE import(s) in schedules module:\n\n${violationMessage}`);
    }

    expect(violations).toHaveLength(0);
  });
});
