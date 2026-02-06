# Design Document: Enterprise Edition Removal

## Overview

This design document outlines the complete removal of the Enterprise Edition (EE) commercial layer from the Cal.com codebase. The project is currently ~25-30% complete with the LICENSE changed to AGPL-only and 33 EE files deleted. However, 173 active EE imports remain across 109 files, causing 22 type-check errors, 108 API v2 build errors, and 707 web workspace type errors.

The removal strategy follows a dependency-first approach, starting with the most critical compilation blockers (API v2) and working through authentication, core packages, and finally cleanup. This ensures the codebase remains buildable at each stage while systematically eliminating all commercial infrastructure.

### Goals

1. **Zero EE Dependencies**: Remove all 173 EE imports from `@/ee`, `@calcom/features/ee`, and `@calcom/ee`
2. **Clean Build State**: Achieve zero errors in all build and type-check processes
3. **License Flow Removal**: Eliminate all commercial license validation infrastructure
4. **Documentation Cleanup**: Remove all commercial references from docs, configs, and user-facing text
5. **Maintainable OSS Codebase**: Ensure all remaining features are appropriate for open-source

### Non-Goals

- Rewriting features from scratch (prefer removal or minimal OSS stubs)
- Adding new functionality during EE removal
- Maintaining backward compatibility with commercial deployments
- Preserving features that are inherently commercial in nature

## Architecture

### Current State

The Cal.com monorepo has EE dependencies distributed across multiple layers:

```
apps/
├── api/v1/          # 3 EE imports (payments, api-keys, teams)
├── api/v2/          # 88+ EE imports (calendars, schedules, event-types, bookings)
└── web/             # Multiple EE imports (auth, license validation, UI)

packages/
├── features/
│   └── ee/          # 16 incomplete stub files (to be removed)
├── app-store/       # EE payment integrations
└── prisma/          # Database schema (may have EE-specific fields)
```

### Target State

After EE removal, the architecture will be simplified:

```
apps/
├── api/v1/          # OSS implementations or feature removal
├── api/v2/          # OSS implementations for all modules
└── web/             # No license validation, OSS auth only

packages/
├── features/        # No ee/ subdirectory
├── app-store/       # OSS integrations only
└── prisma/          # Clean schema without commercial fields
```

### Removal Strategy

The removal follows a **bottom-up dependency order**:

1. **Phase 1: API v2 Critical Path** (88+ imports)
   - Calendars module (CalendarsService, CalendarsRepository, CalendarsCacheService)
   - Schedules module (SchedulesService, SchedulesModule)
   - Event Types module (EventTypesService, EventTypesRepository)
   - Bookings module (CreateBookingOutput)

2. **Phase 2: Authentication & License Flow**
   - LicenseKeySingleton removal
   - License validation functions (validateLicense, updateLicense)
   - License UI components (LicenseSelection.tsx)
   - next-auth-options.ts EE symbols

3. **Phase 3: API v1 & Core Packages**
   - Payment integrations (stripe, team billing)
   - API key generation
   - Team/organization repositories

4. **Phase 4: Complete EE Directory Removal**
   - Delete `/packages/features/ee/` directory
   - Remove all path mappings from tsconfig files
   - Clean up any remaining import references

5. **Phase 5: Documentation & Configuration**
   - README.md commercial references
   - common.json translation strings
   - docker-compose.yml enterprise config
   - Environment variable documentation

## Components and Interfaces

### API v2 Module Replacements

#### Calendars Module

**Current EE Dependencies:**
- `@/ee/calendars/calendars.repository`
- `@/ee/calendars/services/calendars.service`
- `@/ee/calendars/services/calendars-cache.service`
- `@/ee/calendars/outputs/connected-calendars.output`
- `@/ee/calendars/processors/calendars.processor`

**OSS Replacement Strategy:**

```typescript
// packages/features/calendars/repositories/CalendarsRepository.ts
export class CalendarsRepository {
  // Move from EE to OSS location
  // Keep existing implementation if not commercial-specific
}

// packages/features/calendars/services/CalendarsService.ts
export class CalendarsService {
  // Core calendar integration logic (OSS-appropriate)
  async getConnectedCalendars(userId: number): Promise<ConnectedCalendar[]>
  async getCalendarsByUserId(userId: number): Promise<Calendar[]>
}

// packages/features/calendars/services/CalendarsCacheService.ts
export class CalendarsCacheService {
  // Caching layer for calendar data
  async getCachedCalendars(userId: number): Promise<Calendar[] | null>
  async setCachedCalendars(userId: number, calendars: Calendar[]): Promise<void>
}
```

**API v2 Import Updates:**
```typescript
// Before
import { CalendarsService } from "@/ee/calendars/services/calendars.service";

// After
import { CalendarsService } from "@calcom/features/calendars/services/calendars.service";
```

#### Schedules Module

**Current EE Dependencies:**
- `@/ee/schedules/schedules_2024_04_15/services/schedules.service`
- `@/ee/schedules/schedules_2024_06_11/schedules.module`
- `@/ee/schedules/schedules_2024_06_11/services/schedules.service`
- `@/ee/schedules/schedules_2024_04_15/inputs/create-schedule.input`

**OSS Replacement Strategy:**

```typescript
// packages/features/schedules/services/SchedulesService_2024_04_15.ts
export class SchedulesService_2024_04_15 {
  async createSchedule(userId: number, data: CreateScheduleInput): Promise<Schedule>
  async getScheduleById(scheduleId: number): Promise<Schedule | null>
  async updateSchedule(scheduleId: number, data: UpdateScheduleInput): Promise<Schedule>
  async deleteSchedule(scheduleId: number): Promise<void>
}

// packages/features/schedules/SchedulesModule_2024_06_11.ts
@Module({
  providers: [SchedulesService_2024_06_11, SchedulesRepository],
  exports: [SchedulesService_2024_06_11]
})
export class SchedulesModule_2024_06_11 {}
```

**API v2 Import Updates:**
```typescript
// Before
import { SchedulesModule_2024_06_11 } from "@/ee/schedules/schedules_2024_06_11/schedules.module";

// After  
import { SchedulesModule_2024_06_11 } from "@calcom/features/schedules/SchedulesModule_2024_06_11";
```

#### Event Types Module

**Current EE Dependencies:**
- `@/ee/event-types/event-types_2024_04_15/event-types.repository`
- `@/ee/event-types/event-types_2024_06_14/event-types.module`
- `@/ee/event-types/event-types_2024_06_14/services/event-types.service`
- `@/ee/event-types/event-types_2024_06_14/inputs/create-phone-call.input`
- `@/ee/event-types/event-types_2024_06_14/outputs/create-phone-call.output`
- `@/ee/event-types/event-types_2024_04_15/constants/constants`

**OSS Replacement Strategy:**

```typescript
// packages/features/event-types/repositories/EventTypesRepository_2024_04_15.ts
export class EventTypesRepository_2024_04_15 {
  async getEventTypeById(eventTypeId: number): Promise<EventType | null>
  async createEventType(data: CreateEventTypeInput): Promise<EventType>
  async updateEventType(eventTypeId: number, data: UpdateEventTypeInput): Promise<EventType>
}

// packages/features/event-types/services/EventTypesService_2024_06_14.ts
export class EventTypesService_2024_06_14 {
  async createPhoneCall(data: CreatePhoneCallInput): Promise<CreatePhoneCallOutput>
  async getEventTypesByUserId(userId: number): Promise<EventType[]>
}

// packages/features/event-types/constants/constants.ts
export const DEFAULT_EVENT_TYPES = {
  // Default event type configurations
}
```

#### Bookings Module

**Current EE Dependencies:**
- `@/ee/bookings/2024-08-13/outputs/create-booking.output`

**OSS Replacement Strategy:**

```typescript
// packages/features/bookings/outputs/CreateBookingOutput_2024_08_13.ts
export interface CreateBookingOutput_2024_08_13 {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  // ... other booking fields
}
```

### Authentication & License Flow Removal

#### License Singleton Removal

**Files to Modify:**
- `apps/web/pages/auth/setup/getServerSideProps.tsx` (line 2)
- `apps/web/pages/auth/setup/LicenseSelection.tsx` (line 1)
- `packages/features/auth/lib/next-auth-options.ts` (line 808)

**Current Implementation:**
```typescript
// getServerSideProps.tsx
import { LicenseKeySingleton } from "@calcom/ee/common/server/LicenseKeySingleton";

export const getServerSideProps = async (context) => {
  const license = LicenseKeySingleton.get();
  // ... license validation logic
}
```

**OSS Replacement:**
```typescript
// getServerSideProps.tsx
// Remove LicenseKeySingleton import entirely

export const getServerSideProps = async (context) => {
  // Remove all license validation logic
  // Proceed directly to setup flow
}
```

#### License Validation Functions

**Functions to Remove:**
- `validateLicense()`
- `updateLicense()`
- `checkLicenseKey()`
- `getLicenseKeyFromEnv()`

**Files to Modify:**
- `packages/features/auth/lib/next-auth-options.ts`
- Any middleware that checks license status

**Replacement Strategy:**
- Remove all license check middleware
- Remove license-related session properties
- Simplify authentication flow to OSS-only path

#### License UI Components

**Components to Remove:**
- `LicenseSelection.tsx`
- `LicenseKeyInput.tsx`
- Any license status indicators in admin UI

**Replacement Strategy:**
- Delete component files entirely
- Remove routes that render these components
- Update setup wizard to skip license steps

### API v1 Module Updates

#### Payment Integration Removal

**File:** `apps/api/v1/pages/api/teams/_post.ts`

**Current EE Dependency:**
```typescript
import stripe from "@calcom/features/ee/payments/server/stripe";
```

**Replacement Strategy:**
- If team creation requires payment: Remove payment requirement
- If Stripe is needed for OSS features: Move to `@calcom/features/payments/server/stripe`
- If purely commercial: Remove team billing entirely

**Recommended Approach:**
```typescript
// Remove Stripe import
// Remove payment-related logic from team creation
// Allow free team creation for OSS deployments
```

#### API Key Generation

**File:** `apps/api/v1/pages/api/api-keys/_post.ts`

**Current EE Dependency:**
```typescript
import { generateUniqueAPIKey } from "@calcom/features/ee/api-keys/lib/apiKeys";
```

**Replacement Strategy:**
```typescript
// packages/features/api-keys/lib/apiKeys.ts
export function generateUniqueAPIKey(): string {
  // Move implementation from EE to OSS
  // This is not inherently commercial functionality
  return crypto.randomBytes(32).toString('hex');
}
```

#### Team Repository

**File:** `apps/api/v1/pages/api/teams/[teamId]/_patch.ts`

**Current EE Dependencies:**
```typescript
import { purchaseTeamOrOrgSubscription } from "@calcom/features/ee/teams/lib/payments";
import { TeamRepository } from "@calcom/features/ee/teams/repositories/TeamRepository";
```

**Replacement Strategy:**
```typescript
// Remove purchaseTeamOrOrgSubscription entirely (commercial)
// Move TeamRepository to OSS location
// packages/features/teams/repositories/TeamRepository.ts
export class TeamRepository {
  async getTeamById(teamId: number): Promise<Team | null>
  async updateTeam(teamId: number, data: UpdateTeamInput): Promise<Team>
  // ... other team operations
}
```

### TypeScript Configuration Updates

#### Path Mapping Removal

**Files to Modify:**
- `apps/api/v2/tsconfig.json`
- `apps/web/tsconfig.json`
- `packages/tsconfig.json`
- `tsconfig.json` (root)

**Current Path Mappings:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/ee/*": ["./apps/api/v2/src/ee/*"],
      "@calcom/ee/*": ["./packages/features/ee/*"],
      "@calcom/ee": ["./packages/features/ee/index"]
    }
  }
}
```

**After Removal:**
```json
{
  "compilerOptions": {
    "paths": {
      // Remove all EE path mappings
      // Keep only OSS paths
    }
  }
}
```

#### Jest Configuration Updates

**File:** `apps/api/v2/jest-e2e.ts`

**Current Configuration:**
```typescript
moduleNameMapper: {
  "^@calcom/ee/(.*)$": path.join(packagesDir, "features/ee/$1"),
  "^@calcom/ee$": path.join(packagesDir, "features/ee/index"),
}
```

**After Removal:**
```typescript
moduleNameMapper: {
  // Remove EE mappings
  // Update tests to use OSS imports
}
```

## Data Models

### Database Schema Changes

The Prisma schema may contain EE-specific fields that need review:

**Potential EE Fields to Review:**
- License key storage fields
- Commercial feature flags
- Billing/subscription fields (if purely commercial)
- Enterprise-only metadata

**Migration Strategy:**
1. Identify EE-specific fields in `packages/prisma/schema.prisma`
2. Create migration to remove commercial-only fields
3. Update seed data to remove EE references
4. Ensure all queries work without EE fields

**Example Schema Updates:**
```prisma
model User {
  id Int @id @default(autoincrement())
  // Remove: licenseKey String?
  // Remove: enterpriseFeatures Json?
  // Keep: All OSS-appropriate fields
}

model Team {
  id Int @id @default(autoincrement())
  // Remove: subscriptionId String?
  // Remove: billingCycleStart DateTime?
  // Keep: All OSS-appropriate fields
}
```

### Type Definition Updates

**Generated Types:**
After schema changes, regenerate Prisma types:
```bash
yarn prisma generate
```

**Manual Type Updates:**
Remove EE-specific type definitions from:
- `packages/types/` directory
- Component prop types that reference EE features
- API response types that include commercial fields

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, I need to analyze each acceptance criterion for testability.


### Property Reflection

After analyzing all acceptance criteria, I've identified several redundancies:

**Redundant Properties:**
1. Requirements 7.1, 7.4, 7.5, 7.6 all test build/type-check success - can be consolidated into comprehensive build validation
2. Requirements 1.5 and 7.2 both test API v2 build success - duplicate
3. Requirements 3.5 and 7.1 both test type-check:ci success - duplicate
4. Requirements 4.1 and 4.3 both ensure ee/ directory deletion - 4.3 is redundant
5. Requirements 9.1, 9.3 both test tsconfig EE path removal - can be combined
6. Requirements 1.2, 2.1, 2.3, 3.1 all test for absence of EE symbols - can be combined into comprehensive codebase scan
7. Requirements 6.1, 6.2, 6.3, 6.4 all test for absence of license env vars - can be combined

**Consolidated Properties:**
- **Build Success Property**: Combines 1.5, 3.5, 7.1, 7.2, 7.3 into one comprehensive build validation
- **No EE Imports Property**: Combines 1.2, 3.1, 3.3, 4.2 into one codebase-wide import scan
- **No License Symbols Property**: Combines 2.1, 2.3 into one symbol absence check
- **No License Env Vars Property**: Combines 6.1, 6.2, 6.3, 6.4 into one env var check
- **No Commercial Text Property**: Combines 10.1, 10.2 into one user-facing text scan
- **Valid TypeScript Config Property**: Combines 4.5, 9.1, 9.2, 9.3, 9.5 into one tsconfig validation

### Correctness Properties

Property 1: No EE Imports in Codebase
*For any* TypeScript or JavaScript file in the repository, the file should not contain import statements matching the patterns `@/ee`, `@calcom/features/ee`, or `@calcom/ee`
**Validates: Requirements 1.2, 3.1, 3.3, 4.2**

Property 2: No License Symbols in Codebase
*For any* file in the repository, the file should not contain references to `LicenseKeySingleton`, `validateLicense`, or `updateLicense`
**Validates: Requirements 2.1, 2.3**

Property 3: No License Environment Variables
*For any* environment configuration file (.env.example, .env.appStore.example, documentation), the file should not contain references to `CALCOM_LICENSE_KEY` or `GET_LICENSE_KEY_URL`
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Property 4: No Commercial Text in User-Facing Files
*For any* UI component file or translation file, the file should not contain the strings "Enterprise Edition" or "commercial license"
**Validates: Requirements 10.1, 10.2**

Property 5: Valid TypeScript Path Mappings
*For any* tsconfig.json file in the repository, all path mappings in the "paths" configuration should point to directories that exist, and should not contain patterns matching `@/ee`, `@calcom/ee`, or `@calcom/features/ee`
**Validates: Requirements 4.5, 9.1, 9.2, 9.3, 9.5**

Property 6: Build Process Succeeds
*For any* workspace in the monorepo, running the appropriate build or type-check command should complete with exit code 0 and no compilation errors
**Validates: Requirements 1.5, 3.5, 7.1, 7.2, 7.3**

Property 7: EE Import Attempts Fail
*For any* file that attempts to import from an EE path, the build process should fail with a clear error message indicating the module cannot be found
**Validates: Requirements 4.4**

## Error Handling

### Build Failure Scenarios

**Missing Module Errors:**
When EE imports are removed but references remain, TypeScript will produce "Cannot find module" errors. The error handling strategy is:

1. **Detection**: Run `yarn type-check:ci --force` to identify all missing module errors
2. **Classification**: Categorize errors by module type (calendars, schedules, event-types, etc.)
3. **Resolution**: For each error, either:
   - Replace with OSS import from new location
   - Remove the functionality entirely if commercial-only
   - Create minimal OSS stub if needed for compilation

**Type Mismatch Errors:**
When EE types are removed, dependent code may have type errors. The strategy is:

1. **Regenerate Types**: Run `yarn prisma generate` after schema changes
2. **Update Imports**: Change type imports to use OSS locations
3. **Remove Commercial Types**: Delete type definitions that are purely commercial

**Runtime Errors:**
After EE removal, runtime errors may occur if code paths expect EE functionality:

1. **License Validation**: Remove all license check code paths
2. **Feature Flags**: Update feature flags to reflect OSS-only features
3. **Conditional Logic**: Remove or simplify conditionals that check for EE features

### Migration Safety

**Incremental Validation:**
After each phase of removal:
1. Run `yarn type-check:ci --force` to verify no new type errors
2. Run `yarn workspace @calcom/api-v2 build` to verify API v2 compiles
3. Run `yarn workspace @calcom/web type-check` to verify web app compiles
4. Run `TZ=UTC yarn test` to verify unit tests pass

**Rollback Strategy:**
If a phase introduces breaking changes:
1. Revert the specific commit or file changes
2. Analyze the dependency chain to understand what broke
3. Create OSS stubs for the missing functionality
4. Retry the removal with stubs in place

## Testing Strategy

### Dual Testing Approach

This project requires both **unit tests** and **property-based tests** to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary for comprehensive coverage

### Unit Testing Focus

Unit tests should focus on:
- **Specific file checks**: Verify specific files (README.md, common.json, etc.) don't contain commercial references
- **Build command execution**: Verify specific build commands complete successfully
- **Directory existence**: Verify the `/packages/features/ee` directory doesn't exist
- **Integration points**: Verify modules that previously depended on EE now work with OSS implementations

Unit tests should NOT try to cover all possible inputs - that's what property tests are for.

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` (already in devDependencies) for property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: ee-removal, Property {number}: {property_text}`

**Property Test Implementation**:

```typescript
// Example: Property 1 - No EE Imports in Codebase
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { glob } from 'glob';
import fs from 'fs';

describe('EE Removal Properties', () => {
  it('Property 1: No EE imports in codebase', async () => {
    // Feature: ee-removal, Property 1: No EE Imports in Codebase
    
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**', '.turbo/**']
    });
    
    const eeImportPatterns = [
      /@\/ee[\/'"]/,
      /@calcom\/features\/ee[\/'"]/,
      /@calcom\/ee[\/'"]/
    ];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of eeImportPatterns) {
        expect(content).not.toMatch(pattern);
      }
    }
  }, { timeout: 30000 });
  
  it('Property 2: No license symbols in codebase', async () => {
    // Feature: ee-removal, Property 2: No License Symbols in Codebase
    
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**', '.turbo/**']
    });
    
    const licenseSymbols = [
      'LicenseKeySingleton',
      'validateLicense',
      'updateLicense'
    ];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const symbol of licenseSymbols) {
        expect(content).not.toContain(symbol);
      }
    }
  }, { timeout: 30000 });
  
  it('Property 5: Valid TypeScript path mappings', async () => {
    // Feature: ee-removal, Property 5: Valid TypeScript Path Mappings
    
    const tsconfigFiles = await glob('**/tsconfig.json', {
      ignore: ['node_modules/**']
    });
    
    for (const tsconfigFile of tsconfigFiles) {
      const content = JSON.parse(fs.readFileSync(tsconfigFile, 'utf-8'));
      const paths = content.compilerOptions?.paths || {};
      
      // Check no EE path mappings exist
      for (const [key, value] of Object.entries(paths)) {
        expect(key).not.toMatch(/@\/ee|@calcom\/ee|@calcom\/features\/ee/);
      }
      
      // Check all path mappings point to existing directories
      for (const [key, mappings] of Object.entries(paths)) {
        for (const mapping of mappings as string[]) {
          const dir = mapping.replace(/\/\*$/, '');
          const fullPath = path.join(path.dirname(tsconfigFile), dir);
          expect(fs.existsSync(fullPath)).toBe(true);
        }
      }
    }
  }, { timeout: 30000 });
});
```

**Build Validation Tests**:

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Build Success Properties', () => {
  it('Property 6: All builds succeed', async () => {
    // Feature: ee-removal, Property 6: Build Process Succeeds
    
    const commands = [
      'yarn type-check:ci --force',
      'yarn workspace @calcom/api-v2 build',
      'yarn workspace @calcom/web type-check'
    ];
    
    for (const command of commands) {
      expect(() => {
        execSync(command, { stdio: 'pipe' });
      }).not.toThrow();
    }
  }, { timeout: 300000 }); // 5 minute timeout for builds
});
```

### Test Organization

Tests should be organized by property:
- `packages/features/ee-removal/ee-removal.property.test.ts` - All property-based tests
- `packages/features/ee-removal/ee-removal.test.ts` - Specific unit test examples

### Continuous Validation

After each implementation phase:
1. Run property tests to verify no EE references remain
2. Run build validation tests to ensure compilation succeeds
3. Run existing unit tests to ensure no regressions
4. Run `yarn biome check --write .` to ensure code formatting

## Implementation Phases

### Phase 1: API v2 OSS Module Creation (Foundation)

**Objective**: Create OSS implementations of EE modules before removing EE imports

**Steps**:
1. Create `packages/features/calendars/` with CalendarsService, CalendarsRepository, CalendarsCacheService
2. Create `packages/features/schedules/` with SchedulesService, SchedulesModule for all API versions
3. Create `packages/features/event-types/` with EventTypesService, EventTypesRepository for all API versions
4. Create `packages/features/bookings/` with booking output types
5. Export all new modules from `packages/platform/libraries/index.ts` for API v2 consumption

**Validation**:
- New modules compile without errors
- Exports are available from `@calcom/platform-libraries`

### Phase 2: API v2 Import Replacement

**Objective**: Replace all 88+ EE imports in API v2 with OSS imports

**Steps**:
1. Update all calendar-related imports to use `@calcom/platform-libraries`
2. Update all schedule-related imports to use `@calcom/platform-libraries`
3. Update all event-type-related imports to use `@calcom/platform-libraries`
4. Update all booking-related imports to use `@calcom/platform-libraries`
5. Update jest-e2e.ts to remove EE path mappings

**Validation**:
- `yarn workspace @calcom/api-v2 build` completes with zero errors
- No imports matching `@/ee` pattern remain in API v2

### Phase 3: License Flow Removal

**Objective**: Remove all license validation infrastructure

**Steps**:
1. Remove LicenseKeySingleton import and usage from getServerSideProps.tsx
2. Delete LicenseSelection.tsx and related UI components
3. Remove license validation from next-auth-options.ts
4. Remove validateLicense and updateLicense functions
5. Update authentication flow to skip license checks

**Validation**:
- Authentication works without license validation
- No references to LicenseKeySingleton remain
- `yarn workspace @calcom/web type-check` passes

### Phase 4: API v1 & Core Package Updates

**Objective**: Remove EE dependencies from API v1 and core packages

**Steps**:
1. Move generateUniqueAPIKey to `packages/features/api-keys/lib/apiKeys.ts`
2. Move TeamRepository to `packages/features/teams/repositories/TeamRepository.ts`
3. Remove purchaseTeamOrOrgSubscription and team billing logic
4. Remove or move stripe payment integration
5. Update all imports in API v1 to use OSS locations

**Validation**:
- API v1 compiles without errors
- No EE imports remain in API v1

### Phase 5: EE Directory Deletion

**Objective**: Remove all EE directory structure

**Steps**:
1. Delete `/packages/features/ee/` directory
2. Update all tsconfig.json files to remove EE path mappings
3. Verify no files attempt to import from deleted paths

**Validation**:
- `/packages/features/ee/` directory doesn't exist
- `yarn type-check:ci --force` completes with zero errors
- Property tests confirm no EE imports remain

### Phase 6: Documentation & Configuration Cleanup

**Objective**: Remove all commercial references from documentation

**Steps**:
1. Remove Enterprise Edition references from README.md (lines 126, 738)
2. Remove commercial license references from common.json (line 314)
3. Update docker-compose.yml to remove enterprise config (line 98)
4. Remove CALCOM_LICENSE_KEY and GET_LICENSE_KEY_URL from .env.example files
5. Update any other documentation to reflect OSS-only status

**Validation**:
- Property tests confirm no commercial text remains
- Documentation accurately reflects AGPL licensing

### Phase 7: Final Validation

**Objective**: Ensure complete EE removal and clean build state

**Steps**:
1. Run all property-based tests
2. Run full type-check: `yarn type-check:ci --force`
3. Run all workspace builds
4. Run unit tests: `TZ=UTC yarn test`
5. Run linting: `yarn biome check --write .`

**Validation**:
- All property tests pass
- All builds complete successfully
- All tests pass
- No linting errors

## Notes

- Each phase should be implemented as a separate PR following Cal.com PR size guidelines (<500 lines, <10 files)
- Use conventional commits for all changes (e.g., `refactor(api-v2): replace EE calendar imports with OSS`)
- Run `yarn type-check:ci --force` after each phase to catch issues early
- Use `import type` for TypeScript type imports to follow Cal.com conventions
- Avoid using `as any` - use proper type-safe solutions
- All new OSS modules should use `select` instead of `include` in Prisma queries
