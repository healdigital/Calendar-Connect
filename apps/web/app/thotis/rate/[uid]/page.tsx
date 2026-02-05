import prisma from "@calcom/prisma";
import { notFound } from "next/navigation";
import { FeedbackForm } from "../../../feedback/[uid]/FeedbackForm";

export default async function ThotisFeedbackPage({ params }: { params: { uid: string } }) {
  const { uid } = params;

  const booking = await prisma.booking.findUnique({
    where: { uid },
    select: {
      id: true,
      status: true,
      startTime: true,
      metadata: true,
      responses: true,
      sessionRating: {
        select: {
          rating: true,
          feedback: true,
        },
      },
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

  // If already rated, show thank you / summary
  if (booking.sessionRating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900">Merci pour votre retour !</h1>
        <p className="mt-2 text-gray-600">
          Nous avons bien reçu votre évaluation pour votre session de mentorat Thotis.
        </p>
      </div>
    );
  }

  const responses = booking.responses as { email?: string; name?: string } | null;
  const studentEmail = responses?.email;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-xl font-bold">Votre avis sur Thotis</h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Comment s'est passée votre session de mentorat avec le mentor Thotis ?
        </p>
        <FeedbackForm bookingId={booking.id} email={studentEmail || ""} />
      </div>
    </div>
  );
}
