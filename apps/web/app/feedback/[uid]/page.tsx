import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { RatingForm } from "@calcom/features/thotis/components/RatingForm";
import prisma from "@calcom/prisma";
import { notFound } from "next/navigation";

export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: { uid: string };
  searchParams: { token?: string };
}) {
  const { uid } = params;
  const { token } = searchParams;

  const booking = await prisma.booking.findUnique({
    where: { uid },
    select: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
      metadata: true,
      responses: true,
      eventType: {
        select: {
          title: true,
          userId: true, // Mentor userId
        },
      },
    },
  });

  // Verify it's a Thotis session and it has ended
  const metadata = booking?.metadata as { isThotisSession?: boolean } | null;
  const isThotisSession = metadata?.isThotisSession === true;
  const hasEnded = booking?.endTime && booking.endTime < new Date();

  if (!booking || !isThotisSession || !hasEnded) {
    return notFound();
  }

  // No longer checking sessionRating here, RatingForm handles it

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-xl font-bold">Votre avis compte</h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Comment s'est passée votre session de mentorat ?
        </p>
        <RatingForm
          bookingId={booking.id}
          email={(booking.responses as { email?: string })?.email || ""}
          token={token}
        />
      </div>
    </div>
  );
}
