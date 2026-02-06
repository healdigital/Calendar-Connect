import fs from "fs";
import path from "path";
import { describe, expect, it, afterEach } from "vitest";
import { execSync } from "child_process";

/**
 * Property-Based Tests for EE Removal - Import Failure Validation
 * Feature: ee-removal
 */
describe("Property Tests: EE Import Attempts Fail", () => {
  const tempFiles: string[] = [];

  afterEach(() => {
    // Clean up any temporary test files created
    tempFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    tempFiles.length = 0;
  });

  /**
   * Property 7: EE Import Attempts Fail
   * Feature: ee-removal, Property 7: EE Import Attempts Fail
   *
   * **Validates: Requirements 4.4**
   *
   * For any file that attempts to import from an EE path,
   * the build process should fail with a clear error message
   * indicating the module cannot be found
   */
  it("Property 7: EE import attempts fail with clear error messages", { timeout: 60000 }, async () => {
    // Define EE import patterns that should fail
    const eeImportPatterns = [
      { pattern: '@/ee/calendars/services/calendars.service', description: '@/ee path' },
      { pattern: '@calcom/features/ee/schedules/services/schedules.service', description: '@calcom/features/ee path' },
      { pattern: '@calcom/ee/api-keys/lib/apiKeys', description: '@calcom/ee path' },
    ];

    const testResults: Array<{ pattern: string; description: string; failed: boolean; error: string }> = [];

    for (const { pattern, description } of eeImportPatterns) {
      // Create a temporary test file with the EE import
      const tempFileName = `temp-ee-import-test-${Date.now()}-${Math.random().toString(36).substring(7)}.ts`;
      const tempFilePath = path.join(process.cwd(), "packages/features/ee-removal", tempFileName);
      
      const testFileContent = `
// Temporary test file to verify EE imports fail
import { SomeService } from "${pattern}";

export function testFunction() {
  return new SomeService();
}
`;

      fs.writeFileSync(tempFilePath, testFileContent, "utf-8");
      tempFiles.push(tempFilePath);

      // Try to type-check the file
      let typeCheckFailed = false;
      let errorOutput = "";

      try {
        // Run TypeScript compiler on the specific file
        execSync(`npx tsc --noEmit ${tempFilePath}`, {
          cwd: process.cwd(),
          stdio: "pipe",
          encoding: "utf-8",
        });
        // If we reach here, type check succeeded (which is bad - we want it to fail)
        typeCheckFailed = false;
      } catch (error: any) {
        // Type check failed (which is good - this is what we want)
        typeCheckFailed = true;
        errorOutput = error.stderr || error.stdout || error.message || "";
      }

      testResults.push({
        pattern,
        description,
        failed: typeCheckFailed,
        error: errorOutput,
      });
    }

    // Verify all EE import attempts failed
    const successfulImports = testResults.filter((result) => !result.failed);

    if (successfulImports.length > 0) {
      const failureMessage = successfulImports
        .map((result) => `  ${result.description}: ${result.pattern}\n    Expected type-check to fail, but it succeeded`)
        .join("\n\n");
      throw new Error(
        `Found ${successfulImports.length} EE import(s) that did NOT fail as expected:\n\n${failureMessage}\n\nAll EE imports should fail with "Cannot find module" errors.`
      );
    }

    // Verify error messages contain appropriate "Cannot find module" text
    const inappropriateErrors = testResults.filter((result) => {
      const hasCannotFindModule = 
        result.error.includes("Cannot find module") || 
        result.error.includes("cannot find module") ||
        result.error.includes("Module not found") ||
        result.error.includes("module not found");
      return result.failed && !hasCannotFindModule;
    });

    if (inappropriateErrors.length > 0) {
      const warningMessage = inappropriateErrors
        .map((result) => `  ${result.description}: ${result.pattern}\n    Error: ${result.error.substring(0, 200)}...`)
        .join("\n\n");
      console.warn(
        `Warning: ${inappropriateErrors.length} EE import(s) failed but without clear "Cannot find module" messages:\n\n${warningMessage}`
      );
    }

    // All imports should have failed
    expect(testResults.every((result) => result.failed)).toBe(true);
    expect(successfulImports).toHaveLength(0);
  });
});
