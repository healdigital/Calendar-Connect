import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("App Store Package Compilation", () => {
  it("should not contain any EE imports in source files", () => {
    const appStorePath = path.join(process.cwd(), "packages/app-store");
    
    const eeImportPatterns = [
      /@\/ee[\/'"]/,
      /@calcom\/features\/ee[\/'"]/,
      /@calcom\/ee[\/'"]/,
    ];

    const filesWithEEImports: string[] = [];

    function scanDirectory(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(appStorePath, fullPath);

        // Skip node_modules, dist, build, .turbo, and test files
        if (
          relativePath.includes("node_modules") ||
          relativePath.includes("dist") ||
          relativePath.includes("build") ||
          relativePath.includes(".turbo") ||
          relativePath.endsWith(".test.ts") ||
          relativePath.endsWith(".test.tsx")
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, "utf-8");

          for (const pattern of eeImportPatterns) {
            if (pattern.test(content)) {
              filesWithEEImports.push(relativePath);
              break;
            }
          }
        }
      }
    }

    scanDirectory(appStorePath);

    expect(filesWithEEImports).toEqual([]);
  });

  it("should have valid TypeScript configuration without EE path mappings", () => {
    const tsconfigPath = path.join(process.cwd(), "packages/app-store/tsconfig.json");
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));

    // Verify no EE path mappings exist
    const paths = tsconfig.compilerOptions?.paths || {};
    for (const [key] of Object.entries(paths)) {
      expect(key).not.toMatch(/@\/ee|@calcom\/ee|@calcom\/features\/ee/);
    }
  });

  it("should have all app integrations properly structured", () => {
    const appStorePath = path.join(process.cwd(), "packages/app-store");
    
    // Verify key files exist
    expect(fs.existsSync(path.join(appStorePath, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(appStorePath, "tsconfig.json"))).toBe(true);
    
    // Verify no EE directory exists
    const eeDir = path.join(appStorePath, "ee");
    expect(fs.existsSync(eeDir)).toBe(false);
  });

  it("should not reference EE modules in generated files", () => {
    const appStorePath = path.join(process.cwd(), "packages/app-store");
    const generatedFiles = [
      "apps.server.generated.ts",
      "apps.browser.generated.tsx",
      "apps.metadata.generated.ts",
    ];

    const eeImportPatterns = [
      /@\/ee[\/'"]/,
      /@calcom\/features\/ee[\/'"]/,
      /@calcom\/ee[\/'"]/,
    ];

    for (const file of generatedFiles) {
      const filePath = path.join(appStorePath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        
        for (const pattern of eeImportPatterns) {
          expect(content).not.toMatch(pattern);
        }
      }
    }
  });
});
