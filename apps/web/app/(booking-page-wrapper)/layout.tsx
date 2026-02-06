import PageWrapper from "@components/PageWrapperAppDir";
import { headers } from "next/headers";

export default async function BookingPageWrapperLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const nonce = h.get("x-csp-nonce") ?? undefined;

  return (
    <>
      <PageWrapper isBookingPage={true} nonce={nonce}>
        {children}
      </PageWrapper>
    </>
  );
}
