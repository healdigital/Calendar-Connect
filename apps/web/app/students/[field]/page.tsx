"use client";

import { ProfileCard } from "@calcom/features/thotis/components/ProfileCard";
import { AcademicField } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { useParams, useRouter } from "next/navigation";

export default function StudentsByFieldPage() {
  const params = useParams();
  const router = useRouter();
  const field = params?.field as string;

  // Decode URI component for display and query (e.g. "Computer Science" -> "Computer%20Science")
  const decodedField = field ? decodeURIComponent(field) : "";
  const isValidField = Boolean(
    decodedField && Object.values(AcademicField).includes(decodedField as AcademicField)
  );

  const { data, isLoading, error } = trpc.thotis.profile.search.useQuery(
    { fieldOfStudy: isValidField ? (decodedField as AcademicField) : undefined },
    { enabled: isValidField }
  );

  const handleBookSession = (username: string) => {
    router.push(`/thotis/mentor/${username}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-blue-500 border-t-2 border-b-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h2 className="font-semibold text-red-600 text-xl">Error loading mentors</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-3xl text-gray-900 capitalize">
            Mentors in <span className="text-blue-600">{decodedField}</span>
          </h1>
          <p className="text-gray-600">Find and book sessions with experienced students in your field.</p>
        </div>

        {!data?.profiles || data.profiles.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
            <h3 className="mb-2 font-medium text-gray-900 text-lg">No mentors found</h3>
            <p className="text-gray-500">
              We couldn't find any mentors in this field yet. Try searching for another field.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.profiles.map((student) => (
              <ProfileCard
                key={student.id}
                student={student}
                onBookSession={() => student.user.username && handleBookSession(student.user.username)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
