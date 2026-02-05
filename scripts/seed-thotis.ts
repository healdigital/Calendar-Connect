import { prisma } from "@calcom/prisma";
import { AcademicField } from "@calcom/prisma/client";
import { createUserAndEventType } from "./seed-utils";

export async function seedThotis() {
  console.log("🌱 Seeding Thotis data...");

  // 1. Create Mentor User
  const mentorEmail = "mentor@thotis.com";
  const mentorUser = await createUserAndEventType({
    user: {
      email: mentorEmail,
      username: "mentor",
      name: "Jean Mentor",
      password: "mentor",
      completedOnboarding: true,
      theme: "light",
    },
    eventTypes: [
      {
        title: "Session Orientation",
        slug: "orientation-15min",
        length: 15,
        metadata: {
          lockDuration: true,
          thotisEventType: true,
        },
      },
    ],
  });

  if (mentorUser) {
    console.log(`👤 Created Mentor: ${mentorEmail} / mentor`);

    // 2. Create StudentProfile for Mentor
    await prisma.studentProfile.upsert({
      where: { userId: mentorUser.id },
      update: {},
      create: {
        userId: mentorUser.id,
        university: "Université Paris 1 Panthéon-Sorbonne",
        degree: "Licence 3 Droit",
        field: AcademicField.LAW,
        currentYear: 3,
        bio: "Étudiant en droit passionné par le droit constitutionnel. Je peux répondre à toutes tes questions sur la licence de droit !",
        isActive: true,
        totalSessions: 12,
        averageRating: 4.8,
        totalRatings: 10,
      },
    });
    console.log(`🎓 Created StudentProfile for Mentor`);
  }

  // 3. Create Future Student User
  const studentEmail = "student@thotis.com";
  await createUserAndEventType({
    user: {
      email: studentEmail,
      username: "student",
      name: "Paul Lycéen",
      password: "student",
      completedOnboarding: true,
      theme: "light",
    },
  });
  console.log(`👤 Created Student: ${studentEmail} / student`);

  console.log("✅ Thotis seeding completed.");
}
