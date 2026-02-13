"use client";

import { useCompatSearchParams } from "@calcom/lib/hooks/useCompatSearchParams";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect } from "react";

export type SSOProviderPageProps = {
  provider: string;
  tenant?: string;
  product?: string;
  isSAMLLoginEnabled?: boolean;
};

export default function Provider(props: SSOProviderPageProps) {
  const searchParams = useCompatSearchParams();
  const router = useRouter();

  useEffect(() => {
    const email = searchParams?.get("email");
    if (props.provider === "saml") {
      if (!email) {
        router.push(`/auth/error?error=Email not provided`);
        return;
      }

      if (!props.isSAMLLoginEnabled) {
        router.push(`/auth/error?error=SAML login not enabled`);
        return;
      }

      signIn("saml");
    } else if (props.provider === "google" && email) {
      signIn("google", {}, { login_hint: email });
    } else {
      signIn(props.provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
