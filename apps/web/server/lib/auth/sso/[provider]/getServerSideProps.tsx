import type { GetServerSidePropsContext } from "next";

export const getServerSideProps = async ({ req, query }: GetServerSidePropsContext) => {
  return {
    redirect: {
      destination: "/auth/login?error=SSO%20not%20supported",
      permanent: false,
    },
  };
};
