import process from "node:process";
import { prisma } from "@calcom/prisma";
import { MentorStatus } from "@calcom/prisma/client";

/**
 * Fix mentor profiles that should be VERIFIED but are still PENDING_VERIFICATION
 * This script updates all mentor profiles from the seed data to have VERIFIED status
 */
async function fixMentorStatus(): Promise<void> {
  console.log("🔧 Fixing mentor status for seeded profiles...");

  // List of seeded mentor emails
  const SEEDED_MENTOR_EMAILS = [
    "sophie.laurent@thotis.com",
    "thomas.durand@thotis.com",
    "julie.martin@thotis.com",
    "antoine.petit@thotis.com",
    "nicolas.moreau@thotis.com",
    "camille.leroy@thotis.com",
    "elodie.roux@thotis.com",
    "lucas.lefebvre@thotis.com",
    "marie.bertrand@thotis.com",
    "hugo.girard@thotis.com",
  ];

  // Get all users with these emails
  const mentorUsers = await prisma.user.findMany({
    where: {
      email: {
        in: SEEDED_MENTOR_EMAILS,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  console.log(`Found ${mentorUsers.length} mentor users`);

  // Update their profiles to VERIFIED status
  const result = await prisma.studentProfile.updateMany({
    where: {
      userId: {
        in: mentorUsers.map((u) => u.id),
      },
      status: {
        not: MentorStatus.VERIFIED,
      },
    },
    data: {
      status: MentorStatus.VERIFIED,
      isActive: true,
    },
  });

  console.log(`✅ Updated ${result.count} mentor profiles to VERIFIED status`);

  // Verify the fix
  const verifiedCount = await prisma.studentProfile.count({
    where: {
      userId: {
        in: mentorUsers.map((u) => u.id),
      },
      status: MentorStatus.VERIFIED,
    },
  });

  console.log(`✅ Verification: ${verifiedCount}/${mentorUsers.length} mentors now have VERIFIED status`);
}

fixMentorStatus()
  .then(() => {
    console.log("✅ Mentor status fix completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fixing mentor status:", error);
    process.exit(1);
  });
