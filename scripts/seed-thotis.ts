import { prisma } from "@calcom/prisma";
import { AcademicField, MentorStatus } from "@calcom/prisma/client";
import { createUserAndEventType } from "./seed-utils";

const MENTORS = [
  {
    name: "Sophie Laurent",
    email: "sophie.laurent@thotis.com",
    username: "sophie-lo",
    field: AcademicField.LAW,
    university: "Paris 1 Panthéon-Sorbonne",
    degree: "Licence 3 Droit",
    currentYear: 3,
    bio: "Passionnée par le droit constitutionnel, je t'aide à comprendre les rouages de la L1. J'ai aussi fait un stage en cabinet d'avocats, je peux t'en parler !",
    expertise: ["Droit Constitutionnel", "Méthodologie", "Stages"],
    averageRating: 4.9,
    totalRatings: 15,
  },
  {
    name: "Thomas Durand",
    email: "thomas.durand@thotis.com",
    username: "thomas-med",
    field: AcademicField.MEDICINE,
    university: "Université Paris Cité",
    degree: "Externat (DFASM2)",
    currentYear: 5,
    bio: "Je peux t'expliquer le quotidien difficile mais passionnant des études de médecine. On peut parler du PASS/L.AS et de la préparation aux ECN.",
    expertise: ["PASS/LAS", "Externat", "Révisions"],
    averageRating: 4.8,
    totalRatings: 22,
  },
  {
    name: "Julie Martin",
    email: "julie.martin@thotis.com",
    username: "julie-eng",
    field: AcademicField.ENGINEERING,
    university: "École polytechnique",
    degree: "Cycle Ingénieur",
    currentYear: 2,
    bio: "Spécialisée en IA, je t'accompagne pour préparer les concours des grandes écoles et t'aider à choisir ta spécialisation technique.",
    expertise: ["Prépa", "Intelligence Artificielle", "Concours"],
    averageRating: 5.0,
    totalRatings: 8,
  },
  {
    name: "Antoine Petit",
    email: "antoine.petit@thotis.com",
    username: "antoine-biz",
    field: AcademicField.BUSINESS,
    university: "HEC Paris",
    degree: "Master 1",
    currentYear: 4,
    bio: "Aide pour les admissions parallèles et le Gap Year en conseil ou finance. J'ai déjà fait 2 stages en M&A.",
    expertise: ["Admissions Parallèles", "Finance", "Césure"],
    averageRating: 4.7,
    totalRatings: 12,
  },
  {
    name: "Nicolas Moreau",
    email: "nicolas.moreau@thotis.com",
    username: "nico-cs",
    field: AcademicField.COMPUTER_SCIENCE,
    university: "EPITA",
    degree: "Expert en Ingénierie Informatique",
    currentYear: 4,
    bio: "Passionné de cybersécurité, je t'aide à choisir ta spécialisation en info et à monter tes premiers projets persos.",
    expertise: ["Cybersécurité", "Projets Persos", "Dev Ops"],
    averageRating: 4.9,
    totalRatings: 30,
  },
  {
    name: "Camille Leroy",
    email: "camille.leroy@thotis.com",
    username: "camille-psy",
    field: AcademicField.PSYCHOLOGY,
    university: "Lyon 2",
    degree: "Master 2 Psychologie Clinique",
    currentYear: 5,
    bio: "Explore le monde de la psychologie clinique avec moi ! Je peux t'aider sur les dossiers de Master et les stages en HP.",
    expertise: ["Sélection Master", "Clinique", "Orientation"],
    averageRating: 4.8,
    totalRatings: 18,
  },
  {
    name: "Élodie Roux",
    email: "elodie.roux@thotis.com",
    username: "elodie-edu",
    field: AcademicField.EDUCATION,
    university: "ENS Lyon",
    degree: "Master MEEF",
    currentYear: 2,
    bio: "En route pour le CAPES, je te parle des métiers de l'enseignement et de la préparation aux concours de la fonction publique.",
    expertise: ["Concours MEEF", "Métiers de l'enseignement", "Pédagogie"],
    averageRating: 4.6,
    totalRatings: 5,
  },
  {
    name: "Lucas Lefebvre",
    email: "lucas.lefebvre@thotis.com",
    username: "lucas-arts",
    field: AcademicField.ARTS,
    university: "Beaux-Arts de Paris",
    degree: "DNA",
    currentYear: 3,
    bio: "Design, peinture, sculpture : parlons de ton portfolio artistique et de comment intégrer une école d'art prestigieuse.",
    expertise: ["Portfolio", "Concours d'art", "Design"],
    averageRating: 5.0,
    totalRatings: 10,
  },
  {
    name: "Marie Bertrand",
    email: "marie.bertrand@thotis.com",
    username: "marie-sci",
    field: AcademicField.SCIENCES,
    university: "Université de Montpellier",
    degree: "Doctorat Biophysique",
    currentYear: 7,
    bio: "La recherche t'intéresse ? Je te partage mon parcours en sciences fondamentales et mon quotidien en laboratoire.",
    expertise: ["Recherche", "Doctorat", "Biophysique"],
    averageRating: 4.9,
    totalRatings: 7,
  },
  {
    name: "Hugo Girard",
    email: "hugo.girard@thotis.com",
    username: "hugo-iep",
    field: AcademicField.OTHER,
    university: "Sciences Po Paris",
    degree: "Master Affaires Publiques",
    currentYear: 5,
    bio: "Pour tout savoir sur les IEP et les débouchés en administration publique ou en politique.",
    expertise: ["Sciences Po", "Concours Admin", "Relations Internationales"],
    averageRating: 4.7,
    totalRatings: 14,
  },
];

export async function seedThotis(): Promise<void> {
  console.log("🌱 Seeding Thotis data...");

  for (const mentorData of MENTORS) {
    // 1. Create Mentor User & EventType
    const mentorUser = await createUserAndEventType({
      user: {
        email: mentorData.email,
        username: mentorData.username,
        name: mentorData.name,
        password: "password123",
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
      console.log(`👤 Upserted Mentor: ${mentorData.email}`);

      // 2. Create StudentProfile for Mentor
      // IMPORTANT: All seeded mentors must have status: VERIFIED and isActive: true
      const profile = await prisma.studentProfile.upsert({
        where: { userId: mentorUser.id },
        update: {
          university: mentorData.university,
          degree: mentorData.degree,
          field: mentorData.field,
          currentYear: mentorData.currentYear,
          bio: mentorData.bio,
          expertise: mentorData.expertise,
          averageRating: mentorData.averageRating,
          totalRatings: mentorData.totalRatings,
          isActive: true,
          status: MentorStatus.VERIFIED, // Seeded mentors are pre-verified
        },
        create: {
          userId: mentorUser.id,
          university: mentorData.university,
          degree: mentorData.degree,
          field: mentorData.field,
          currentYear: mentorData.currentYear,
          bio: mentorData.bio,
          expertise: mentorData.expertise,
          averageRating: mentorData.averageRating,
          totalRatings: mentorData.totalRatings,
          isActive: true,
          status: MentorStatus.VERIFIED, // Seeded mentors are pre-verified
        },
      });

      // Verify the mentor was created with correct status
      if (profile.status !== MentorStatus.VERIFIED) {
        console.warn(
          `⚠️  WARNING: Mentor ${mentorData.email} was not set to VERIFIED status. Current status: ${profile.status}`
        );
      }

      // 3. Add a sample rating
      await prisma.sessionRating
        .create({
          data: {
            bookingId: (await prisma.booking.findFirst({ where: { userId: mentorUser.id } }))?.id || 0,
            studentProfileId: profile.id,
            rating: 5,
            feedback: `Super session avec ${mentorData.name} ! Très à l'écoute et de bons conseils.`,
            prospectiveEmail: "demo-student@gmail.com",
          },
        })
        .catch(() => {
          // Skip if booking doesn't exist or rating exists
        });
    }
  }

  // 4. Create a general Student User for testing
  const studentEmail = "student@thotis.com";
  await createUserAndEventType({
    user: {
      email: studentEmail,
      username: "demo-student",
      name: "Paul Lycéen",
      password: "studentpassword",
      completedOnboarding: true,
      theme: "light",
    },
  });
  console.log(`👤 Created Student: ${studentEmail}`);

  // 5. Create a default Admin User for testing
  const adminEmail = "admin@thotis.com";
  await createUserAndEventType({
    user: {
      email: adminEmail,
      username: "thotis-admin",
      name: "Admin Thotis",
      password: "adminpassword",
      completedOnboarding: true,
      theme: "dark",
      role: "ADMIN",
    },
  });
  console.log(`👤 Created Admin: ${adminEmail} (password: adminpassword)`);

  // 6. Verify all mentors have VERIFIED status
  const verifiedMentorsCount = await prisma.studentProfile.count({
    where: {
      status: MentorStatus.VERIFIED,
      user: {
        email: {
          in: MENTORS.map((m) => m.email),
        },
      },
    },
  });

  console.log(
    `✅ Thotis seeding completed. ${verifiedMentorsCount}/${MENTORS.length} mentors have VERIFIED status.`
  );

  if (verifiedMentorsCount !== MENTORS.length) {
    console.warn(
      `⚠️  WARNING: Not all mentors have VERIFIED status! Expected ${MENTORS.length}, got ${verifiedMentorsCount}`
    );
    console.warn(`⚠️  Run 'npx ts-node --transpile-only scripts/fix-mentor-status.ts' to fix this issue.`);
  }
}
