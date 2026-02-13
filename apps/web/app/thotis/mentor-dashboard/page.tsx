"use client";

import { MentorDashboard } from "@calcom/features/thotis/components/MentorDashboard";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useRouter } from "next/navigation";

export default function MentorDashboardPage() {
  const router = useRouter();

  // This page requires auth - the session user is the mentor
  // We use the session hook that Cal.com provides through tRPC context
  const { data: session, isLoading: isLoadingSession } = trpc.viewer.me.get.useQuery();

  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <Icon name="lock" className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Authentication Required</h2>
        <p className="mb-6 text-center text-gray-600">
          You need to be logged in as a mentor to access this dashboard.
        </p>
        <Button color="primary" onClick={() => router.push("/auth/login")}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        {/* Back navigation */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/thotis")}
            className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700">
            <Icon name="arrow-left" className="mr-1 h-4 w-4" />
            Back to Thotis
          </button>
        </div>

        <MentorDashboard userId={session.id} />
      </div>
    </div>
  );
}
