import process from "node:process";
import type { GetServerSidePropsContext } from "next";

export const getServerSideProps = async ({ req, query }: GetServerSidePropsContext) => {
  return {
    redirect: {
      destination: "/auth/login?error=SSO%20not%20supported",
      permanent: false,
    },
  };
};

type GetStripePremiumUsernameUrl = {
  userId: string;
  userEmail: string;
  username: string;
  successDestination: string;
  tracking?: TrackingData;
};

const getStripePremiumUsernameUrl = async ({
  userId,
  userEmail,
  username,
  successDestination,
  tracking,
}: GetStripePremiumUsernameUrl): Promise<string | null> => {
  // @TODO: probably want to check if stripe user email already exists? or not
  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: {
      email: userEmail,
      username,
    },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [
      {
        price: getPremiumMonthlyPlanPriceId(),
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}${successDestination}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.NEXT_PUBLIC_WEBAPP_URL || "https://app.cal.com",
    allow_promotion_codes: true,
    metadata: {
      dubCustomerId: userId, // pass the userId during checkout creation for sales conversion tracking: https://d.to/conversions/stripe
      ...(tracking?.googleAds?.gclid && {
        gclid: tracking.googleAds.gclid,
        campaignId: tracking.googleAds.campaignId,
      }),
      ...(tracking?.linkedInAds?.liFatId && {
        liFatId: tracking.linkedInAds.liFatId,
        linkedInCampaignId: tracking.linkedInAds?.campaignId,
      }),
    },
  });

  return checkoutSession.url;
};
