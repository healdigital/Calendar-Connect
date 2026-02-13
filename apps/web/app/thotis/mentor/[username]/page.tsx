"use client";

import { BookingWidget } from "@calcom/features/thotis/components/BookingWidget";
import { ThotisAnalyticsEventType } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { UserAvatar } from "@calcom/ui/components/avatar/UserAvatar";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MentorProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const router = useRouter();

  const {
    data: profile,
    isLoading,
    error,
  } = trpc.thotis.profile.getByUsername.useQuery(
    {
      username,
    },
    {
      enabled: !!username,
    }
  );

  const trackEvent = trpc.thotis.analytics.track.useMutation();

  useEffect(() => {
    if (profile && !isLoading && !error) {
      trackEvent.mutate({
        eventType: ThotisAnalyticsEventType.profile_viewed,
        profileId: profile.id,
        field: profile.field,
      });
    }
  }, [profile, isLoading, error, trackEvent.mutate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h2 className="text-xl font-semibold text-red-600">Mentor not found</h2>
        <p className="text-gray-600">The mentor you are looking for doesn't exist or is not active.</p>
        <Button className="mt-4" onClick={() => router.push("/thotis/mentors")}>
          Back to Mentors
        </Button>
      </div>
    );
  }

  const { user } = profile as any;
  const rating = profile.averageRating ?? 0;
  const totalRatings = profile.totalRatings ?? 0;
  const formattedRating = Number(rating).toFixed(1).replace(/\.0$/, "");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/thotis/mentors")}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <Icon name="arrow-left" className="h-4 w-4 mr-1" />
            Back to Mentors
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <UserAvatar size="xl" user={user} className="h-24 w-24 border-2 border-white shadow-sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                    <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 border border-green-100">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs font-semibold text-green-700">Available</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Icon name="building" className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{profile.university}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon name="book" className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{profile.degree}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{profile.currentYear} Year Student</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center gap-1">
                      <Icon name="star" className="h-4 w-4 fill-orange-400 text-orange-400" />
                      <span className="text-lg font-bold text-gray-900">{formattedRating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({totalRatings} reviews)</span>
                  </div>

                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    <h3 className="text-gray-900 font-semibold mb-2">About Me</h3>
                    <p>{profile.bio}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Background</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon name="book" className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Field of Study</h4>
                    <p className="text-sm text-gray-600">{profile.field}</p>
                  </div>
                </div>
                {profile.linkedInUrl && (
                  <div className="flex items-start gap-3 pt-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon name="link" className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">LinkedIn Profile</h4>
                      <a
                        href={profile.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline">
                        View Professional Profile
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-10">
              <BookingWidget studentProfileId={profile.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
