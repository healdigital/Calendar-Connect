# Requirements Document: Enterprise Edition Removal

## Introduction

This document specifies the requirements for completely removing the Enterprise Edition (EE) commercial layer from the Cal.com codebase. The repository has been partially de-commercialized (~25-30% complete) with the LICENSE changed to AGPL-only and 33 EE files deleted. However, significant commercial references, dependencies, and build failures remain. This specification covers the complete removal of all EE code, imports, references, and commercial infrastructure to achieve a clean, fully open-source AGPL codebase.

## Glossary

- **EE**: Enterprise Edition - the commercial layer of Cal.com that is being removed
- **System**: The Cal.com codebase and build infrastructure
- **License_Flow**: The authentication and validation system for commercial license keys
- **EE_Import**: Any import statement referencing `@/ee`, `@calcom/features/ee`, or `@calcom/ee`
- **Build_Process**: The compilation and type-checking processes including `yarn type-check:ci`, `yarn build`, and workspace-specific builds
- **API_v2**: The Cal.com API version 2 application located in `apps/api/v2`
- **Commercial_Reference**: Any mention of commercial features, enterprise edition, or license keys in documentation, configuration, or code
- **OSS_Implementation**: Open-source software implementation that replaces or removes EE functionality

## Requirements

### Requirement 1: Remove API v2 EE Dependencies

**User Story:** As a developer, I want API v2 to build without EE dependencies, so that the application can compile successfully.

#### Acceptance Criteria

1. WHEN the Build_Process runs for API_v2, THE System SHALL complete without errors related to missing `@/ee` imports
2. THE System SHALL remove or replace all 88 EE_Import statements in API_v2
3. WHEN organizations.module.ts is compiled, THE System SHALL not reference any `@/ee` paths
4. THE System SHALL provide OSS_Implementation alternatives for all removed EE functionality in API_v2
5. WHEN `yarn workspace @calcom/api-v2 build` executes, THE System SHALL complete with zero compilation errors

### Requirement 2: Remove License Authentication Flow

**User Story:** As a developer, I want the authentication system to operate without commercial license validation, so that the codebase is fully open-source.

#### Acceptance Criteria

1. THE System SHALL remove LicenseKeySingleton from all import statements and usage
2. WHEN getServerSideProps.tsx is loaded, THE System SHALL not import or reference LicenseKeySingleton
3. THE System SHALL remove the entire license validation flow including validateLicense and updateLicense functions
4. WHEN next-auth-options.ts is executed, THE System SHALL not reference any EE license symbols
5. THE System SHALL remove LicenseSelection.tsx and all license key selection UI components
6. WHEN authentication occurs, THE System SHALL not perform any license key validation checks

### Requirement 3: Remove EE Imports from Core Packages

**User Story:** As a developer, I want all core packages to build without EE dependencies, so that the monorepo is fully functional.

#### Acceptance Criteria

1. THE System SHALL remove or replace all 173 active EE_Import statements across 109 files
2. WHEN app-store package is compiled, THE System SHALL complete without EE-related type errors
3. WHEN features package is compiled, THE System SHALL not reference `@calcom/features/ee` paths
4. THE System SHALL provide OSS_Implementation alternatives or explicit feature removal for all EE functionality
5. WHEN `yarn type-check:ci --force` executes, THE System SHALL complete with zero errors

### Requirement 4: Remove EE Directory Structure

**User Story:** As a developer, I want the EE directory completely removed, so that no commercial code remains in the repository.

#### Acceptance Criteria

1. THE System SHALL delete the `/packages/features/ee` directory and all its contents
2. WHEN the repository is scanned, THE System SHALL contain zero files in any `ee/` subdirectory
3. THE System SHALL remove all 16 incomplete stub files from `/packages/features/ee/`
4. WHEN any module attempts to import from EE paths, THE Build_Process SHALL fail with clear error messages indicating the path no longer exists
5. THE System SHALL update all path mappings in tsconfig files to remove EE path references

### Requirement 5: Remove Commercial References from Documentation

**User Story:** As a user, I want documentation to reflect the open-source nature of the project, so that there is no confusion about licensing.

#### Acceptance Criteria

1. THE System SHALL remove all Commercial_Reference instances from README.md
2. WHEN README.md is read, THE System SHALL not contain references to Enterprise Edition on lines 126 or 738
3. THE System SHALL remove commercial license references from common.json translation file
4. WHEN common.json is parsed, THE System SHALL not contain commercial references on line 314
5. THE System SHALL update docker-compose.yml to remove enterprise-related configuration on line 98

### Requirement 6: Remove Commercial Environment Variables

**User Story:** As a developer, I want environment configuration to exclude commercial variables, so that deployment is simplified.

#### Acceptance Criteria

1. THE System SHALL remove CALCOM_LICENSE_KEY from all environment variable documentation
2. THE System SHALL remove GET_LICENSE_KEY_URL from all environment variable documentation
3. WHEN environment files are parsed, THE System SHALL not reference any license-related variables
4. THE System SHALL update .env.example files to remove commercial variable placeholders
5. WHEN the application starts, THE System SHALL not attempt to read or validate license environment variables

### Requirement 7: Achieve Clean Build State

**User Story:** As a developer, I want all build processes to complete successfully, so that the codebase is production-ready.

#### Acceptance Criteria

1. WHEN `yarn type-check:ci --force` executes, THE System SHALL complete with zero errors
2. WHEN `yarn workspace @calcom/api-v2 build` executes, THE System SHALL complete with zero errors
3. WHEN `yarn workspace @calcom/web type-check` executes, THE System SHALL complete with zero errors
4. THE System SHALL resolve all 707 type errors across 207 files in the web workspace
5. THE System SHALL resolve all 108 build errors in API_v2
6. THE System SHALL resolve all 22 type-check errors that currently stop at @calcom/app-store

### Requirement 8: Maintain Feature Parity for OSS Features

**User Story:** As a user, I want core functionality to remain intact after EE removal, so that the application remains useful.

#### Acceptance Criteria

1. WHEN EE functionality is removed, THE System SHALL preserve all features that are appropriate for open-source
2. THE System SHALL document any features that are explicitly removed due to commercial nature
3. WHEN a feature requires EE code, THE System SHALL either provide an OSS_Implementation or clearly mark it as removed
4. THE System SHALL maintain all authentication flows that do not depend on license validation
5. WHEN users access the application, THE System SHALL provide full functionality for all OSS-appropriate features

### Requirement 9: Update Import Path Mappings

**User Story:** As a developer, I want TypeScript path mappings to be accurate, so that imports resolve correctly.

#### Acceptance Criteria

1. THE System SHALL update all tsconfig.json files to remove EE path mappings
2. WHEN TypeScript resolves imports, THE System SHALL not attempt to resolve `@/ee/*` paths
3. THE System SHALL update all tsconfig.json files to remove `@calcom/features/ee/*` path mappings
4. WHEN workspace builds occur, THE System SHALL not reference non-existent EE directories
5. THE System SHALL validate that all path mappings point to existing directories

### Requirement 10: Clean Up Product and Marketing References

**User Story:** As a contributor, I want the codebase to reflect its open-source status, so that the project identity is clear.

#### Acceptance Criteria

1. THE System SHALL remove all references to "Enterprise Edition" from user-facing text
2. THE System SHALL remove all references to "commercial license" from user-facing text
3. WHEN product documentation is reviewed, THE System SHALL only reference AGPL licensing
4. THE System SHALL update any pricing or feature comparison documentation to reflect OSS-only status
5. WHEN marketing materials are present in the repository, THE System SHALL update them to reflect open-source positioning
