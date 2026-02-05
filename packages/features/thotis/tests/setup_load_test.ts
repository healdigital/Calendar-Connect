import process from "node:process";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";

async function setup() {
  console.log("Starting setup...");
  const prisma = new PrismaClient();
  console.log("Prisma client initialized");
  const jwtService = new JwtService({ secret: process.env.JWT_SECRET || "asjdijI1JIO12I3O89198jojioSAJDU" });
  console.log("JWT service initialized");

  // 1. Create a test user
  const email = "test-mentor@example.com";
  console.log(`Searching for user with email: ${email}`);
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log("User not found, creating test user...");
    user = await prisma.user.create({
      data: {
        email,
        name: "Test Mentor",
        username: "test-mentor",
        studentProfile: {
          create: {
            university: "Test University",
            degree: "Master of Load Testing",
            field: "COMPUTER_SCIENCE",
            currentYear: 1,
            bio: "I am a test mentor for load testing purposes. I love performance.",
            isActive: true,
          },
        },
      },
    });
    console.log("User created.");
  }

  let profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    console.log("Profile not found, creating student profile...");
    profile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        university: "Test University",
        degree: "Master of Load Testing",
        field: "COMPUTER_SCIENCE",
        currentYear: 1,
        bio: "I am a test mentor for load testing purposes. I love performance.",
        isActive: true,
      },
    });
    console.log("Profile created.");
  }

  // 2. Generate token
  console.log("Generating token...");
  const token = jwtService.sign({ email: user.email, id: user.id });

  console.log("\n--- RESULT ---");
  console.log(
    JSON.stringify({
      token,
      userId: user.id,
      profileId: profile?.id,
      email: user.email,
    })
  );
  console.log("--- END RESULT ---\n");

  await prisma.$disconnect();
}

setup().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});
