# Implementation Plan: Enterprise Edition Removal

## Overview

This implementation plan breaks down the complete removal of the Enterprise Edition (EE) commercial layer from Cal.com into discrete, manageable tasks. The approach follows a dependency-first strategy, starting with creating OSS module foundations, then replacing imports, removing license infrastructure, and finally cleaning up documentation. Each task is designed to maintain a buildable codebase and can be implemented as a small PR (<500 lines, <10 files) following Cal.com conventions.

## Tasks

- [x] 1. Create OSS Calendars Module Foundation
  - Create `packages/features/calendars/repositories/CalendarsRepository.ts` with core calendar data access methods
  - Create `packages/features/calendars/services/CalendarsService.ts` with getConnectedCalendars and getCalendarsByUserId methods
  - Create `packages/features/calendars/services/CalendarsCacheService.ts` with caching layer for calendar data
  - Create `packages/features/calendars/outputs/ConnectedCalendar.ts` with Calendar and ConnectedCalendar type definitions
  - Export all calendar modules from `packages/platform/libraries/index.ts`
  - Use `import type` for TypeScript type imports
  - Use `select` instead of `include` in all Prisma queries
  - _Requirements: 1.2, 1.4, 3.1_

- [x] 1.1 Write property test for calendars module exports
  - **Property 1: No EE Imports in Codebase**
  - **Validates: Requirements 1.2, 3.1**

- [x] 2. Create OSS Schedules Module Foundation
  - Create `packages/features/schedules/services/SchedulesService_2024_04_15.ts` with CRUD operations for schedules
  - Create `packages/features/schedules/services/SchedulesService_2024_06_11.ts` with updated schedule operations
  - Create `packages/features/schedules/SchedulesModule_2024_06_11.ts` as NestJS module
  - Create `packages/features/schedules/inputs/CreateScheduleInput_2024_04_15.ts` with input types
  - Create `packages/features/schedules/repositories/SchedulesRepository.ts` with data access methods
  - Export all schedule modules from `packages/platform/libraries/index.ts`
  - _Requirements: 1.2, 1.4, 3.1_

- [x] 2.1 Write property test for schedules module exports
  - **Property 1: No EE Imports in Codebase**
  - **Validates: Requirements 1.2, 3.1**

- [x] 3. Create OSS Event Types Module Foundation
  - Create `packages/features/event-types/repositories/EventTypesRepository_2024_04_15.ts` with event type data access
  - Create `packages/features/event-types/repositories/EventTypesRepository_2024_06_14.ts` with updated repository
  - Create `packages/features/event-types/services/EventTypesService_2024_06_14.ts` with business logic
  - Create `packages/features/event-types/EventTypesModule_2024_06_14.ts` as NestJS module
  - Create `packages/features/event-types/inputs/CreatePhoneCallInput.ts` with input types
  - Create `packages/features/event-types/outputs/CreatePhoneCallOutput.ts` with output types
  - Create `packages/features/event-types/constants/constants.ts` with DEFAULT_EVENT_TYPES
  - Export all event-types modules from `packages/platform/libraries/index.ts`
  - _Requirements: 1.2, 1.4, 3.1_

- [x] 3.1 Write property test for event-types module exports
  - **Property 1: No EE Imports in Codebase**
  - **Validates: Requirements 1.2, 3.1**

- [x] 4. Create OSS Bookings Module Foundation
  - Create `packages/features/bookings/outputs/CreateBookingOutput_2024_08_13.ts` with booking output types
  - Export booking types from `packages/platform/libraries/index.ts`
  - _Requirements: 1.2, 1.4, 3.1_

- [x] 5. Checkpoint - Verify OSS Module Foundations
  - Run `yarn type-check:ci --force` to verify new modules compile
  - Verify all exports are available from `@calcom/platform-libraries`
  - Ensure all tests pass, ask the user if questions arise

- [x] 6. Replace API v2 Calendar Imports
  - Update `apps/api/v2/src/modules/destination-calendars/services/destination-calendars.service.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/destination-calendars/controllers/destination-calendars.controller.e2e-spec.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/destination-calendars/destination-calendars.module.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/selected-calendars/selected-calendars.module.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/selected-calendars/controllers/selected-calendars.controller.e2e-spec.ts` to import from `@calcom/platform-libraries`
  - Remove all imports matching `@/ee/calendars/*` pattern
  - _Requirements: 1.2, 1.3, 3.1_

- [x] 6.1 Write unit test for API v2 calendar module compilation
  - Test that destination-calendars module compiles without errors
  - Test that selected-calendars module compiles without errors
  - _Requirements: 1.1, 1.5_

- [x] 7. Replace API v2 Schedule Imports
  - Update `apps/api/v2/src/modules/slots/slots-2024-04-15/services/slots-output.service.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/slots/slots-2024-04-15/services/slots.service.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/slots/slots-2024-04-15/controllers/slots.controller.e2e-spec.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/routing-forms/controllers/routing-forms.e2e-spec.ts` to import from `@calcom/platform-libraries`
  - Update all slots-2024-09-04 e2e test files to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/teams/bookings/teams-bookings.controller.e2e-spec.ts` to import from `@calcom/platform-libraries`
  - Remove all imports matching `@/ee/schedules/*` pattern
  - _Requirements: 1.2, 3.1_

- [x] 7.1 Write unit test for API v2 slots module compilation
  - Test that slots modules compile without errors
  - _Requirements: 1.1, 1.5_

- [x] 8. Replace API v2 Event Types Imports
  - Update `apps/api/v2/src/modules/event-types/guards/event-type-ownership.guard.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/teams/event-types/controllers/teams-event-types.controller.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/teams/event-types/teams-event-types.module.ts` to import from `@calcom/platform-libraries`
  - Update `apps/api/v2/src/modules/oauth-clients/controllers/oauth-client-users/oauth-client-users.controller.e2e-spec.ts` to import from `@calcom/platform-libraries`
  - Remove all imports matching `@/ee/event-types/*` pattern
  - _Requirements: 1.2, 3.1_

- [x] 8.1 Write unit test for API v2 event-types module compilation
  - Test that event-types modules compile without errors
  - _Requirements: 1.1, 1.5_

- [x] 9. Replace API v2 Bookings Imports
  - Update `apps/api/v2/src/modules/teams/bookings/teams-bookings.controller.e2e-spec.ts` to import from `@calcom/platform-libraries`
  - Remove all imports matching `@/ee/bookings/*` pattern
  - _Requirements: 1.2, 3.1_

- [x] 10. Update API v2 Jest Configuration
  - Remove EE path mappings from `apps/api/v2/jest-e2e.ts`
  - Remove lines containing `"^@calcom/ee/(.*)$"` and `"^@calcom/ee$"` from moduleNameMapper
  - _Requirements: 1.2, 9.1_

- [x] 11. Checkpoint - Verify API v2 Builds Successfully
  - Run `yarn workspace @calcom/api-v2 build` to verify zero compilation errors
  - Run property test to verify no `@/ee` imports remain in API v2
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 1.1, 1.5_

- [x] 11.1 Write property test for API v2 EE import absence
  - **Property 1: No EE Imports in Codebase** (API v2 scope)
  - **Validates: Requirements 1.2, 3.1**

- [x] 12. Remove LicenseKeySingleton from Web Auth
  - Remove LicenseKeySingleton import from `apps/web/pages/auth/setup/getServerSideProps.tsx`
  - Remove all license validation logic from getServerSideProps function
  - Simplify setup flow to proceed directly without license checks
  - _Requirements: 2.1, 2.2_

- [x] 12.1 Write unit test for getServerSideProps without license validation
  - Test that getServerSideProps works without LicenseKeySingleton
  - _Requirements: 2.2_

- [x] 13. Delete License UI Components
  - Delete `apps/web/pages/auth/setup/LicenseSelection.tsx` file
  - Remove any routes that render LicenseSelection component
  - Update setup wizard to skip license selection steps
  - _Requirements: 2.5_

- [x] 13.1 Write unit test for license file deletion
  - Test that LicenseSelection.tsx file doesn't exist
  - _Requirements: 2.5_

- [x] 14. Remove License Validation from NextAuth
  - Remove EE license symbols from `packages/features/auth/lib/next-auth-options.ts` (line 808)
  - Remove validateLicense and updateLicense function calls
  - Remove license-related session properties
  - Simplify authentication flow to OSS-only path
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 14.1 Write property test for license symbol absence
  - **Property 2: No License Symbols in Codebase**
  - **Validates: Requirements 2.1, 2.3**

- [x] 15. Checkpoint - Verify Web Auth Works Without License
  - Run `yarn workspace @calcom/web type-check` to verify zero errors
  - Run property test to verify no LicenseKeySingleton references remain
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 16. Create OSS API Keys Module
  - Create `packages/features/api-keys/lib/apiKeys.ts` with generateUniqueAPIKey function
  - Move implementation from EE to OSS location
  - Use crypto.randomBytes for key generation
  - _Requirements: 3.1, 3.4_

- [x] 17. Update API v1 API Keys Endpoint
  - Update `apps/api/v1/pages/api/api-keys/_post.ts` to import from `@calcom/features/api-keys/lib/apiKeys`
  - Remove import from `@calcom/features/ee/api-keys/lib/apiKeys`
  - _Requirements: 3.1_

- [x] 17.1 Write unit test for API key generation
  - Test that generateUniqueAPIKey produces valid keys
  - _Requirements: 3.1_

- [x] 18. Create OSS Teams Module
  - Create `packages/features/teams/repositories/TeamRepository.ts` with team data access methods
  - Implement getTeamById, updateTeam, and other team operations
  - Use `select` instead of `include` in Prisma queries
  - _Requirements: 3.1, 3.4_

- [x] 19. Update API v1 Teams Endpoints
  - Update `apps/api/v1/pages/api/teams/[teamId]/_patch.ts` to import TeamRepository from OSS location
  - Remove purchaseTeamOrOrgSubscription import and all team billing logic
  - Remove stripe import from `apps/api/v1/pages/api/teams/_post.ts`
  - Allow free team creation for OSS deployments
  - _Requirements: 3.1_

- [x] 19.1 Write unit test for team operations without billing
  - Test that team creation works without payment requirements
  - _Requirements: 3.1_

- [x] 20. Checkpoint - Verify API v1 Builds Successfully
  - Run type-check for API v1 to verify zero errors
  - Run property test to verify no EE imports remain in API v1
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 3.1, 3.5_

- [x] 21. Remove App-Store EE Dependencies
  - Identify and update any EE imports in `packages/app-store/`
  - Replace with OSS implementations or remove commercial-only integrations
  - _Requirements: 3.1, 3.2_

- [x] 21.1 Write unit test for app-store compilation
  - Test that app-store package compiles without EE-related type errors
  - _Requirements: 3.2_

- [x] 22. Remove Features Package EE Self-References
  - Scan `packages/features/` for any imports matching `@calcom/features/ee`
  - Replace with direct imports or remove if no longer needed
  - _Requirements: 3.1, 3.3_

- [x] 22.1 Write property test for features package EE imports
  - **Property 1: No EE Imports in Codebase** (features package scope)
  - **Validates: Requirements 3.1, 3.3**

- [x] 23. Delete EE Directory Structure
  - Delete `/packages/features/ee/` directory and all its contents
  - Verify deletion removes all 16 incomplete stub files
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 23.1 Write unit test for EE directory deletion
  - Test that `/packages/features/ee/` directory doesn't exist
  - **Property 1: No EE Imports in Codebase** (verify no ee/ subdirectories)
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 24. Update Root TypeScript Configuration
  - Remove EE path mappings from root `tsconfig.json`
  - Remove patterns matching `@/ee/*`, `@calcom/ee/*`, `@calcom/features/ee/*`
  - _Requirements: 4.5, 9.1, 9.2, 9.3_

- [x] 25. Update API v2 TypeScript Configuration
  - Remove EE path mappings from `apps/api/v2/tsconfig.json`
  - Remove patterns matching `@/ee/*`
  - _Requirements: 4.5, 9.1, 9.2_

- [x] 26. Update Web TypeScript Configuration
  - Remove EE path mappings from `apps/web/tsconfig.json`
  - Remove patterns matching `@calcom/ee/*`, `@calcom/features/ee/*`
  - _Requirements: 4.5, 9.1, 9.3_

- [x] 27. Update Packages TypeScript Configuration
  - Remove EE path mappings from `packages/tsconfig.json`
  - Remove patterns matching `@calcom/features/ee/*`
  - _Requirements: 4.5, 9.1, 9.3_

- [x] 27.1 Write property test for TypeScript configuration validity
  - **Property 5: Valid TypeScript Path Mappings**
  - **Validates: Requirements 4.5, 9.1, 9.2, 9.3, 9.5**

- [x] 28. Checkpoint - Verify Complete Build Success
  - Run `yarn type-check:ci --force` to verify zero errors across all workspaces
  - Run `yarn workspace @calcom/api-v2 build` to verify API v2 compiles
  - Run `yarn workspace @calcom/web type-check` to verify web compiles
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 28.1 Write property test for build success
  - **Property 6: Build Process Succeeds**
  - **Validates: Requirements 1.5, 3.5, 7.1, 7.2, 7.3**

- [x] 28.2 Write property test for EE import failure
  - **Property 7: EE Import Attempts Fail**
  - **Validates: Requirements 4.4**

- [x] 29. Remove Commercial References from README
  - Remove Enterprise Edition references from `README.md` (lines 126, 738)
  - Update any feature descriptions to reflect OSS-only status
  - Ensure AGPL licensing is clearly stated
  - _Requirements: 5.1, 5.2_

- [x] 29.1 Write unit test for README commercial reference removal
  - Test that README.md doesn't contain "Enterprise Edition" on lines 126 or 738
  - _Requirements: 5.2_

- [x] 30. Remove Commercial References from Translations
  - Remove commercial license references from `apps/web/public/static/locales/en/common.json` (line 314)
  - Remove any other commercial-related translation strings
  - _Requirements: 5.3, 5.4_

- [x] 30.1 Write unit test for translation commercial reference removal
  - Test that common.json doesn't contain commercial references on line 314
  - _Requirements: 5.4_

- [x] 31. Update Docker Configuration
  - Remove enterprise-related configuration from `docker-compose.yml` (line 98)
  - Update any Docker environment variables to remove license-related vars
  - _Requirements: 5.5_

- [x] 31.1 Write unit test for Docker configuration cleanup
  - Test that docker-compose.yml doesn't contain enterprise config on line 98
  - _Requirements: 5.5_

- [x] 32. Remove License Environment Variables from Documentation
  - Remove CALCOM_LICENSE_KEY from all .env.example files
  - Remove GET_LICENSE_KEY_URL from all .env.example files
  - Update environment variable documentation to remove license-related vars
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 32.1 Write property test for license environment variable removal
  - **Property 3: No License Environment Variables**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 33. Remove Commercial Text from User-Facing Files
  - Search all UI component files for "Enterprise Edition" and "commercial license"
  - Remove or replace with OSS-appropriate text
  - Update translation files to remove commercial strings
  - _Requirements: 10.1, 10.2_

- [x] 33.1 Write property test for commercial text removal
  - **Property 4: No Commercial Text in User-Facing Files**
  - **Validates: Requirements 10.1, 10.2**

- [-] 34. Final Validation and Cleanup
  - Run all property-based tests to verify complete EE removal
  - Run `yarn type-check:ci --force` to verify zero errors
  - Run `TZ=UTC yarn test` to verify all unit tests pass
  - Run `yarn biome check --write .` to format and lint all code
  - Verify all 7 correctness properties pass
  - _Requirements: All requirements_

- [ ] 34.1 Run complete property test suite
  - Execute all 7 property tests
  - Verify 100+ iterations per property test
  - Confirm zero failures

- [ ] 35. Final Checkpoint - Complete EE Removal
  - Confirm zero EE imports remain in codebase
  - Confirm all builds and type-checks pass
  - Confirm no commercial references in documentation
  - Confirm clean AGPL-only open source codebase achieved
  - Ask the user if any questions or issues remain

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster implementation
- Each task should be implemented as a separate PR following Cal.com guidelines (<500 lines, <10 files)
- Use conventional commits for all PRs (e.g., `refactor(api-v2): replace EE calendar imports with OSS`)
- Run `yarn type-check:ci --force` after each task to catch issues early
- Use `import type` for TypeScript type imports
- Use `select` instead of `include` in all Prisma queries
- Run `yarn biome check --write .` before committing to ensure proper formatting
- Checkpoints ensure incremental validation and provide natural stopping points
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
