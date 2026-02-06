import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";
import { UserPermissionRole } from "@calcom/prisma/enums";
import type { GetServerSidePropsContext } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;

  const userCount = await prisma.user.count();

  const session = await getServerSession({ req });

  if (session?.user.role && session?.user.role !== UserPermissionRole.ADMIN) {
    return {
      notFound: true,
    } as const;
  }

  return {
    props: {
      userCount,
    },
  };
}
