import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { glob } from "glob";

/**
 * Unit Tests for EE Directory Deletion
 * Feature: ee-removal
 * Task: 23.1
 */
describe("EE Directory Deletion", () => {
  /**
   * Test that /packages/features/ee/ directory doesn't exist
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  it("should verify /packages/features/ee/ directory does not exist", () => {
    const eeDirectoryPath = path.join(process.cwd(), "packages/features/ee");
    const exists = fs.existsSync(eeDirectoryPath);

    expect(exists).toBe(false);
  });

  /**
   * Property 1: No EE Imports in Codebase (verify no ee/ subdirectories)
   * Feature: ee-removal, Property 1: No EE Imports in Codebase
   *
   * **Validates: Requirements 4.1, 4.2, 4.3**
   *
   * For any directory in the repository, there should be no subdirectories
   * named 'ee' that could contain Enterprise Edition code
   */
  it("Property 1: No ee/ subdirectories exist in the codebase", async () => {
    // Search for any directories named 'ee' in the repository
    const rootPath = process.cwd();
    
    // Find all directories named 'ee' (excluding node_modules, .git, dist, etc.)
    const eeDirectories = await glob("**/ee/", {
      cwd: rootPath,
      ignore: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        ".next/**",
        ".turbo/**",
        "build/**",
        "coverage/**",
        ".snaplet/**",
      ],
      absolute: true,
    });

    // Track violations
    const violations = eeDirectories.map((dir) => path.relative(rootPath, dir));

    // Assert no ee/ directories found
    if (violations.length > 0) {
      const violationMessage = violations.map((v) => `  ${v}`).join("\n");
      throw new Error(
        `Found ${violations.length} ee/ subdirectory(ies) in the codebase:\n\n${violationMessage}\n\nAll Enterprise Edition directories should be removed.`
      );
    }

    expect(violations).toHaveLength(0);
  });

  /**
   * Additional verification: Check that no active import statements reference the deleted EE directory
   * Note: Commented-out imports are allowed as they may be historical references
   */
  it("should verify no active import statements reference packages/features/ee", async () => {
    const rootPath = process.cwd();
    
    // Get all TypeScript and JavaScript files
    const files = await glob("**/*.{ts,tsx,js,jsx}", {
      cwd: rootPath,
      ignore: [
        "node_modules/**",
        ".git/**",
        "dist/**",
        ".next/**",
        ".turbo/**",
        "build/**",
        "coverage/**",
        "**/*.test.{ts,tsx,js,jsx}",
        "**/*.spec.{ts,tsx,js,jsx}",
      ],
      absolute: true,
    });

    // Pattern to match active (non-commented) imports from packages/features/ee
    const eePackagePattern = /from\s+['"]@calcom\/features\/ee/;
    const commentPattern = /^\s*(\/\/|\/\*|\*)/;
    
    // Track violations
    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Skip commented lines
        if (commentPattern.test(line)) {
          return;
        }
        
        if (eePackagePattern.test(line)) {
          violations.push({
            file: path.relative(rootPath, file),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }

    // Assert no violations found
    if (violations.length > 0) {
      const violationMessage = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join("\n\n");
      throw new Error(
        `Found ${violations.length} active import(s) referencing @calcom/features/ee:\n\n${violationMessage}\n\nAll imports should be updated to use OSS implementations.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
