"use client";

import { MentorListView } from "@calcom/features/thotis/components/MentorListView";
import {
  MentorSearchFilters,
  type MentorSearchFiltersState,
} from "@calcom/features/thotis/components/MentorSearchFilters";
import { trpc } from "@calcom/trpc/react";
import { Icon } from "@calcom/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function MentorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<MentorSearchFiltersState>({
    fieldOfStudy: searchParams?.get("field") || "",
    university: searchParams?.get("university") || "",
    minRating: searchParams?.get("minRating") ? Number(searchParams.get("minRating")) : 0,
  });

  const [localIntent, _setLocalIntent] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thotis_orientation_intent");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse local intent", e);
        }
      }
    }
    return null;
  });

  const { data: intentData } = trpc.thotis.intent.get.useQuery(undefined, {
    enabled: !!searchParams?.get("field") === false && typeof window !== "undefined", // Only fetch intent if not searching by field explicitly
  });

  // Effective intent (DB or localStorage fallback)
  const effectiveIntent = intentData || localIntent;

  const { data: recommendations, isLoading: isRefLoading } = trpc.thotis.intent.getRecommended.useQuery(
    {
      targetFields: effectiveIntent?.targetFields || [],
      academicLevel: effectiveIntent?.academicLevel || "",
      zone: effectiveIntent?.zone,
    },
    {
      enabled:
        !!effectiveIntent && (effectiveIntent.targetFields?.length > 0 || !!effectiveIntent.academicLevel),
    }
  );

  const { data, isLoading, error } = trpc.thotis.profile.search.useQuery(
    {
      fieldOfStudy: (filters.fieldOfStudy as any) || undefined,
      university: filters.university || undefined,
      minRating: filters.minRating || undefined,
    },
    undefined
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
        <h2 className="font-semibold text-red-600 text-xl">Error loading mentors</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="mb-2 font-bold text-3xl text-gray-900">Our Mentors</h1>
          <p className="text-gray-600">Find the right mentor to help you in your academic journey.</p>
        </div>

        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 && !filters.fieldOfStudy && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="sparkles" className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-xl">Recommended for your orientation</h2>
            </div>
            <MentorListView
              profiles={(recommendations as any) || []}
              isLoading={isRefLoading}
              total={recommendations.length}
              onBookSession={handleBookSession}
            />
            <hr className="my-10 border-subtle" />
          </div>
        )}

        {/* Search Filters */}
        <div className="mb-6">
          <MentorSearchFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* All Mentors List */}
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-bold text-gray-900 text-xl">
            {filters.fieldOfStudy ? `Mentors in ${filters.fieldOfStudy}` : "All Mentors"}
          </h2>
        </div>
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
