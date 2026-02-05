"use client";

import { StudentDashboard } from "@calcom/features/thotis/components/StudentDashboard";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function MySessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const token = searchParams?.get("token");
  const displayEmail = session?.user?.email;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
      </div>
    );
  }

  // Allow access if user is authenticated OR if a valid guest token is present
  if (!token && (status === "unauthenticated" || !displayEmail)) {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/thotis/my-sessions")}`);
    return null;
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

        <div>
          <StudentDashboard email={displayEmail || ""} token={token || undefined} />
        </div>
      </div>
    </div>
  );
}
