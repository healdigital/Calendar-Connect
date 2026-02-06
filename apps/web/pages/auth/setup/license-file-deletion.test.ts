import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("License file deletion", () => {
  it("should verify LicenseSelection.tsx file doesn't exist", () => {
    // Feature: ee-removal, Requirement 2.5
    // Test that LicenseSelection.tsx file has been deleted
    const licenseSelectionPath = join(__dirname, "LicenseSelection.tsx");

    expect(existsSync(licenseSelectionPath)).toBe(false);
  });

  it("should verify no license-related UI components exist in setup directory", () => {
    // Feature: ee-removal, Requirement 2.5
    // Additional check for any license-related files
    const setupDir = __dirname;
    const licenseFiles = [
      join(setupDir, "LicenseSelection.tsx"),
      join(setupDir, "LicenseKeyInput.tsx"),
      join(setupDir, "LicenseValidation.tsx"),
    ];

    licenseFiles.forEach((filePath) => {
      expect(existsSync(filePath)).toBe(false);
    });
  });
});
