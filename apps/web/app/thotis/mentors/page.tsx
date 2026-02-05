"use client";

import { MentorListView } from "@calcom/features/thotis/components/MentorListView";
import {
  MentorSearchFilters,
  type MentorSearchFiltersState,
} from "@calcom/features/thotis/components/MentorSearchFilters";
import { trpc } from "@calcom/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function MentorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<MentorSearchFiltersState>({
    fieldOfStudy: searchParams.get("field") || "",
    university: searchParams.get("university") || "",
    minRating: Number(searchParams.get("minRating")) || 0,
  });

  const { data, isLoading, error } = trpc.thotis.profile.search.useQuery(
    {
      fieldOfStudy: filters.fieldOfStudy || undefined,
      university: filters.university || undefined,
      minRating: filters.minRating || undefined,
    },
    { keepPreviousData: true }
  );

  const handleFiltersChange = useCallback(
    (newFilters: MentorSearchFiltersState) => {
      setFilters(newFilters);

      // Sync filters to URL params
      const params = new URLSearchParams();
      if (newFilters.fieldOfStudy) params.set("field", newFilters.fieldOfStudy);
      if (newFilters.university) params.set("university", newFilters.university);
      if (newFilters.minRating) params.set("minRating", String(newFilters.minRating));

      const qs = params.toString();
      router.push(`/thotis/mentors${qs ? `?${qs}` : ""}`);
    },
    [router]
  );

  const handleBookSession = useCallback(
    (username: string) => {
      router.push(`/thotis/mentor/${username}`);
    },
    [router]
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error loading mentors</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Our Mentors</h1>
          <p className="text-gray-600">Find the right mentor to help you in your academic journey.</p>
        </div>

        {/* Search Filters */}
        <div className="mb-6">
          <MentorSearchFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* Mentor List */}
        <MentorListView
          profiles={(data?.profiles as any) || []}
          isLoading={isLoading && !data}
          total={data?.total || 0}
          onBookSession={handleBookSession}
        />
      </div>
    </div>
  );
}
