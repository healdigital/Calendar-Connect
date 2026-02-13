"use client";

import AdminDashboard from "@calcom/features/thotis/components/AdminDashboard";
import { MentorDashboard } from "@calcom/features/thotis/components/MentorDashboard";
import { StudentDashboard } from "@calcom/features/thotis/components/StudentDashboard";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { useRouter } from "next/navigation";

export default function ThotisDashboardPage() {
  const router = useRouter();
  const { data: me, isLoading: isLoadingMe } = trpc.viewer.me.get.useQuery();
  const { data: profile, isLoading: isLoadingProfile } = trpc.thotis.profile.get.useQuery();

  if (isLoadingMe || isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <Icon name="lock" className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Authentication Required</h2>
        <p className="mb-6 text-center text-gray-600">Please sign in to access your Thotis dashboard.</p>
        <Button color="primary" onClick={() => router.push("/auth/login")}>
          Sign In
        </Button>
      </div>
    );
  }

  // Determine which dashboard to show
  // 1. Admin Dashboard
  if ((me as any).role === "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-10 px-4">
          <AdminDashboard />
        </div>
      </div>
    );
  }

  // 2. Mentor Dashboard if user has a student profile
  if (profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-10 px-4">
          <MentorDashboard userId={me.id} />
        </div>
      </div>
    );
  }

  // 3. Default: Student Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-10 px-4">
        <StudentDashboard email={me.email} />
      </div>
    </div>
  );
}
