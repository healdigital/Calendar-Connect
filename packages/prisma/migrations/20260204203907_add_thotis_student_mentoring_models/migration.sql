-- CreateEnum
CREATE TYPE "public"."AcademicField" AS ENUM ('LAW', 'MEDICINE', 'ENGINEERING', 'BUSINESS', 'COMPUTER_SCIENCE', 'PSYCHOLOGY', 'EDUCATION', 'ARTS', 'SCIENCES', 'OTHER');

-- CreateTable
CREATE TABLE "public"."StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "university" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "field" "public"."AcademicField" NOT NULL,
    "currentYear" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "linkedInUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "cancelledSessions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionRating" (
    "id" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "prospectiveEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "public"."StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_field_isActive_idx" ON "public"."StudentProfile"("field", "isActive");

-- CreateIndex
CREATE INDEX "StudentProfile_userId_idx" ON "public"."StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionRating_bookingId_key" ON "public"."SessionRating"("bookingId");

-- CreateIndex
CREATE INDEX "SessionRating_studentProfileId_idx" ON "public"."SessionRating"("studentProfileId");

-- CreateIndex
CREATE INDEX "SessionRating_bookingId_idx" ON "public"."SessionRating"("bookingId");

-- AddForeignKey
ALTER TABLE "public"."StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionRating" ADD CONSTRAINT "SessionRating_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionRating" ADD CONSTRAINT "SessionRating_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "public"."StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
