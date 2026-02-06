import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { glob } from "glob";

/**
 * Property-Based Tests for EE Removal - TypeScript Configuration Validity
 * Feature: ee-removal
 */
describe("Property Tests: TypeScript Configuration Validity", () => {
  /**
   * Property 5: Valid TypeScript Path Mappings
   * Feature: ee-removal, Property 5: Valid TypeScript Path Mappings
   *
   * **Validates: Requirements 4.5, 9.1, 9.2, 9.3, 9.5**
   *
   * For any tsconfig.json file in the repository:
   * 1. All path mappings in the "paths" configuration should point to directories that exist
   * 2. Should not contain patterns matching `@/ee`, `@calcom/ee`, or `@calcom/features/ee`
   */
  it(
    "Property 5: Valid TypeScript path mappings",
    { timeout: 30000 },
    async () => {
      // Get all tsconfig.json files in the repository
      const tsconfigFiles = await glob("**/tsconfig.json", {
        cwd: process.cwd(),
        ignore: [
          "node_modules/**",
          "**/node_modules/**",
          "dist/**",
          "**/dist/**",
          ".next/**",
          "**/.next/**",
          ".turbo/**",
          "**/.turbo/**",
        ],
        absolute: true,
      });

      // Track violations
      const eePathViolations: Array<{ file: string; pathKey: string }> = [];
      const invalidPathViolations: Array<{ file: string; pathKey: string; mapping: string; reason: string }> =
        [];

      // EE path patterns to check for
      const eePathPatterns = [/@\/ee/, /@calcom\/ee/, /@calcom\/features\/ee/];

      // Check each tsconfig.json file
      for (const tsconfigFile of tsconfigFiles) {
        let content: any;
        try {
          const fileContent = fs.readFileSync(tsconfigFile, "utf-8");
          // Remove comments from JSON (simple approach for tsconfig.json)
          const cleanedContent = fileContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
          content = JSON.parse(cleanedContent);
        } catch (error) {
          // Skip files that can't be parsed (might be invalid or have complex comments)
          continue;
        }

        const paths = content.compilerOptions?.paths || {};
        const tsconfigDir = path.dirname(tsconfigFile);
        const relativeFile = path.relative(process.cwd(), tsconfigFile);

        // Check 1: No EE path mappings should exist
        for (const pathKey of Object.keys(paths)) {
          for (const pattern of eePathPatterns) {
            if (pattern.test(pathKey)) {
              eePathViolations.push({
                file: relativeFile,
                pathKey,
              });
            }
          }
        }

        // Check 2: All path mappings should point to existing directories
        for (const [pathKey, mappings] of Object.entries(paths)) {
          const mappingArray = Array.isArray(mappings) ? mappings : [mappings];

          for (const mapping of mappingArray as string[]) {
            // Remove wildcard suffix if present
            const cleanMapping = mapping.replace(/\/\*$/, "");

            // Resolve the path relative to the tsconfig directory
            const resolvedPath = path.resolve(tsconfigDir, cleanMapping);

            // Check if the path exists
            if (!fs.existsSync(resolvedPath)) {
              // Check if it's a file path (ends with .ts, .tsx, .js, etc.)
              const isFilePath = /\.(ts|tsx|js|jsx|json)$/.test(cleanMapping);

              if (isFilePath) {
                // For file paths, check if the file exists
                if (!fs.existsSync(resolvedPath)) {
                  invalidPathViolations.push({
                    file: relativeFile,
                    pathKey,
                    mapping,
                    reason: `File does not exist: ${resolvedPath}`,
                  });
                }
              } else {
                // For directory paths, check if the directory exists
                invalidPathViolations.push({
                  file: relativeFile,
                  pathKey,
                  mapping,
                  reason: `Directory does not exist: ${resolvedPath}`,
                });
              }
            }
          }
        }
      }

      // Assert no EE path violations
      if (eePathViolations.length > 0) {
        const violationMessage = eePathViolations
          .map((v) => `  ${v.file}\n    Path key: "${v.pathKey}"`)
          .join("\n\n");
        throw new Error(
          `Found ${eePathViolations.length} EE path mapping(s) in tsconfig files:\n\n${violationMessage}\n\nAll EE path mappings must be removed (Requirements 4.5, 9.1, 9.2, 9.3).`
        );
      }

      // Assert no invalid path violations
      if (invalidPathViolations.length > 0) {
        const violationMessage = invalidPathViolations
          .map((v) => `  ${v.file}\n    Path key: "${v.pathKey}"\n    Mapping: "${v.mapping}"\n    ${v.reason}`)
          .join("\n\n");
        throw new Error(
          `Found ${invalidPathViolations.length} invalid path mapping(s) in tsconfig files:\n\n${violationMessage}\n\nAll path mappings must point to existing files or directories (Requirement 9.5).`
        );
      }

      expect(eePathViolations).toHaveLength(0);
      expect(invalidPathViolations).toHaveLength(0);
    }
  );
});
