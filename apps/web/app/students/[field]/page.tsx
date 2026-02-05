"use client";

import { ProfileCard } from "@calcom/features/thotis/components/ProfileCard";
import { trpc } from "@calcom/trpc/react";
import { useParams, useRouter } from "next/navigation";

export default function StudentsByFieldPage() {
  const params = useParams();
  const router = useRouter();
  const field = params?.field as string;

  // Decode URI component for display and query (e.g. "Computer Science" -> "Computer%20Science")
  const decodedField = field ? decodeURIComponent(field) : "";

  const { data, isLoading, error } = trpc.thotis.profile.search.useQuery(
    { fieldOfStudy: decodedField },
    { enabled: !!decodedField }
  );

  const handleBookSession = (username: string) => {
    router.push(`/thotis/mentor/${username}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error loading mentors</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 capitalize mb-2">
            Mentors in <span className="text-blue-600">{decodedField}</span>
          </h1>
          <p className="text-gray-600">Find and book sessions with experienced students in your field.</p>
        </div>

        {!data?.profiles || data.profiles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
            <p className="text-gray-500">
              We couldn't find any mentors in this field yet. Try searching for another field.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
