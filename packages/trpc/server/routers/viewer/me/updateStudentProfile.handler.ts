import { prisma } from "@calcom/prisma";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";
import type { TUpdateStudentProfileInputSchema } from "./updateStudentProfile.schema";

type UpdateStudentProfileOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TUpdateStudentProfileInputSchema;
};

export const updateStudentProfileHandler = async ({ ctx, input }: UpdateStudentProfileOptions) => {
  const { user } = ctx;

  const data = {
    ...input,
  };

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: data,
  });

  // Use the repository or direct prisma call, but ensure we don't use 'any'
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { metadata: true },
  });

  // Also update user metadata to reflect mentor status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      metadata: {
        ...((currentUser?.metadata as Record<string, unknown>) || {}),
        userType: "MENTOR",
      },
    },
  });

  return studentProfile;
};
