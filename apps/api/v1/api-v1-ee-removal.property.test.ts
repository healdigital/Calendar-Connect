import { describe, it, expect } from "vitest";
import { glob } from "glob";
import fs from "fs";
import path from "path";

describe("Property Tests: API v1 EE Removal", () => {
  /**
   * Property 1: No EE Imports in Codebase (API v1 scope)
   * Feature: ee-removal, Property 1: No EE Imports in Codebase
   *
   * **Validates: Requirements 3.1, 3.5**
   *
   * For any TypeScript or JavaScript file in API v1, the file should not contain
   * import statements matching the patterns `@/ee`, `@calcom/features/ee`, or `@calcom/ee`
   */
  it(
    "Property 1: No EE imports in API v1",
    { timeout: 30000 },
    async () => {
      // Get all TypeScript and JavaScript files in the API v1 directory
      const apiV1Path = path.join(process.cwd(), "apps/api/v1");

      const files = await glob("**/*.{ts,tsx,js,jsx}", {
        cwd: apiV1Path,
        ignore: ["node_modules/**", ".next/**", "dist/**", ".turbo/**", "**/*.test.ts", "**/*.spec.ts"],
        absolute: true,
      });

      expect(files.length).toBeGreaterThan(0);

      const eeImportPatterns = [
        /@\/ee[\/'"]/,
        /@calcom\/features\/ee[\/'"]/,
        /@calcom\/ee[\/'"]/,
      ];

      const filesWithEEImports: Array<{ file: string; matches: string[] }> = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const matches: string[] = [];

        for (const pattern of eeImportPatterns) {
          if (pattern.test(content)) {
            // Extract the actual import line for better error reporting
            const lines = content.split("\n");
            const matchingLines = lines.filter((line) => pattern.test(line));
            matches.push(...matchingLines);
          }
        }

        if (matches.length > 0) {
          filesWithEEImports.push({
            file: path.relative(process.cwd(), file),
            matches,
          });
        }
      }

      if (filesWithEEImports.length > 0) {
        const errorMessage = filesWithEEImports
          .map(({ file, matches }) => `${file}:\n  ${matches.join("\n  ")}`)
          .join("\n\n");

        throw new Error(
          `Found EE imports in ${filesWithEEImports.length} file(s) in API v1:\n\n${errorMessage}`
        );
      }

      expect(filesWithEEImports).toHaveLength(0);
    }
  );
});
