import path from "node:path";
import process from "node:process";
import dotEnv from "dotenv";

dotEnv.config({ path: path.resolve(__dirname, "../.env") });

import { prisma } from "@calcom/prisma";
import { UserPermissionRole } from "@calcom/prisma/enums";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: yarn ts-node scripts/create-admin.ts <email>");
    process.exit(1);
  }

  console.log(`Attempting to promote ${email} to ADMIN...`);

  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: UserPermissionRole.ADMIN,
    },
  });

  console.log(`✅ User ${email} has been promoted to ADMIN.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
