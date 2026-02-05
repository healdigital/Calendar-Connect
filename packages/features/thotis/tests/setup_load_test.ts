import process from "node:process";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "../../../prisma/index";

async function setup() {
  console.log("Starting setup...");
  console.log("Using DATABASE_URL:", process.env.DATABASE_URL);

  // prisma is already initialized in the imported module
  console.log("Prisma client loaded from packages/prisma");

  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || "XF+Hws3A5g2eyWA5uGYYVJ74X+wrCWJ8oWo6kAfU6O8=",
  });
  console.log("JWT service initialized");

  try {
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
          // Add default required fields if needed
        } as any,
      });
      console.log("User created:", user.id);
    } else {
      console.log("User found:", user.id);
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
      console.log("Profile created:", profile.id);
    } else {
      console.log("Profile found:", profile.id);
    }

    // 2. Generate token
    console.log("Generating token...");
    const token = jwtService.sign({ email: user.email, id: user.id, name: user.name });

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
  } catch (err) {
    console.error("Operation failed:", err);
    if (err instanceof Error) {
      console.error(err.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

setup().catch((error) => {
  console.error("Setup script crashed:", error);
  process.exit(1);
});
