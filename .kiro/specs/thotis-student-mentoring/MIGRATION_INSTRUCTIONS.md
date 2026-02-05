# Thotis Student Mentoring Platform - Migration Instructions

## Migration Created

**Migration Name**: `20260204203907_add_thotis_student_mentoring_models`

**Location**: `packages/prisma/migrations/20260204203907_add_thotis_student_mentoring_models/migration.sql`

## What Was Created

The migration adds the following database objects:

### 1. AcademicField Enum
- LAW
- MEDICINE
- ENGINEERING
- BUSINESS
- COMPUTER_SCIENCE
- PSYCHOLOGY
- EDUCATION
- ARTS
- SCIENCES
- OTHER

### 2. StudentProfile Table
Fields:
- `id` (TEXT, Primary Key)
- `userId` (INTEGER, Unique, Foreign Key to users)
- `university` (TEXT)
- `degree` (TEXT)
- `field` (AcademicField enum)
- `currentYear` (INTEGER)
- `bio` (TEXT)
- `profilePhotoUrl` (TEXT, nullable)
- `linkedInUrl` (TEXT, nullable)
- `isActive` (BOOLEAN, default true)
- `totalSessions` (INTEGER, default 0)
- `completedSessions` (INTEGER, default 0)
- `cancelledSessions` (INTEGER, default 0)
- `averageRating` (DECIMAL(3,2), nullable)
- `totalRatings` (INTEGER, default 0)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

Indexes:
- Unique index on `userId`
- Composite index on `(field, isActive)` for filtering
- Index on `userId` for lookups

### 3. SessionRating Table
Fields:
- `id` (TEXT, Primary Key)
- `bookingId` (INTEGER, Unique, Foreign Key to bookings)
- `studentProfileId` (TEXT, Foreign Key to StudentProfile)
- `rating` (INTEGER, 1-5 stars)
- `feedback` (TEXT, nullable)
- `prospectiveEmail` (TEXT)
- `createdAt` (TIMESTAMP)

Indexes:
- Unique index on `bookingId`
- Index on `studentProfileId` for lookups
- Index on `bookingId` for lookups

### 4. Foreign Key Relationships
- StudentProfile.userId → users.id (CASCADE on delete)
- SessionRating.bookingId → bookings.id (CASCADE on delete)
- SessionRating.studentProfileId → StudentProfile.id (CASCADE on delete)

## How to Apply the Migration

### Prerequisites

1. **Install Dependencies**:
   ```bash
   yarn install
   ```

2. **Set Up Database**:
   - Ensure PostgreSQL is running
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/calcom"
     ```

### Apply Migration

#### Option 1: Using Prisma Migrate (Recommended)

```bash
# From the root directory
yarn workspace @calcom/prisma db-migrate

# Or from packages/prisma directory
cd packages/prisma
yarn prisma migrate deploy
```

#### Option 2: Manual SQL Execution

If you need to apply the migration manually:

```bash
# Connect to your PostgreSQL database
psql -U username -d calcom

# Run the migration SQL
\i packages/prisma/migrations/20260204203907_add_thotis_student_mentoring_models/migration.sql
```

### Verify Migration

After applying the migration, verify it was successful:

```bash
# Generate Prisma Client with new types
yarn workspace @calcom/prisma generate

# Or from packages/prisma directory
cd packages/prisma
yarn prisma generate
```

### Check Database

Verify the tables were created:

```sql
-- Check if enum was created
SELECT * FROM pg_type WHERE typname = 'AcademicField';

-- Check if tables exist
\dt StudentProfile
\dt SessionRating

-- Check indexes
\d StudentProfile
\d SessionRating
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop tables (will cascade to foreign keys)
DROP TABLE IF EXISTS "public"."SessionRating" CASCADE;
DROP TABLE IF EXISTS "public"."StudentProfile" CASCADE;

-- Drop enum
DROP TYPE IF EXISTS "public"."AcademicField";
```

## Next Steps

After successfully applying the migration:

1. ✅ Run `yarn prisma generate` to regenerate Prisma Client types
2. ✅ Run `yarn type-check:ci --force` to verify TypeScript compilation
3. ✅ Proceed to task 1.3: Write property test for StudentProfile model
4. ✅ Proceed to task 1.4: Write property test for SessionRating model

## Troubleshooting

### Error: "relation already exists"
The migration has already been applied. Check your database or use `yarn prisma migrate status`.

### Error: "type already exists"
The AcademicField enum already exists. You may need to drop it first or skip that part of the migration.

### Error: "database does not exist"
Create the database first:
```bash
createdb calcom
```

### Error: "permission denied"
Ensure your database user has CREATE privileges:
```sql
GRANT CREATE ON DATABASE calcom TO your_user;
```

## Migration Validation

The migration follows Cal.com conventions:
- ✅ Uses `public` schema prefix
- ✅ Uses TEXT for CUID primary keys
- ✅ Uses INTEGER for auto-increment IDs
- ✅ Uses TIMESTAMP(3) for datetime fields
- ✅ Includes proper CASCADE rules on foreign keys
- ✅ Creates indexes for frequently queried fields
- ✅ Follows naming conventions (PascalCase for tables)
- ✅ Includes default values where appropriate
