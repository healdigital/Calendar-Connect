"use client";

import { OrientationIntentForm } from "@calcom/features/thotis/components/OrientationIntentForm";
import { trpc } from "@calcom/trpc/react";
import { Button, Icon } from "@calcom/ui";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ThotisLandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const upsertIntent = trpc.thotis.intent.upsert.useMutation();

  const handleFindMentors = () => {
    router.push("/thotis/mentors");
  };

  const handleBecomeMentor = () => {
    const signupUrl = "/thotis/mentor/signup";
    if (session) {
      router.push(signupUrl);
    } else {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(signupUrl)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Thotis</span>
            </div>
            <div className="flex gap-3">
              {session ? (
                <>
                  <Button
                    color="minimal"
                    onClick={() => router.push("/thotis/my-sessions")}
                    className="gap-2">
                    <Icon name="calendar" className="h-4 w-4" />
                    Mes Sessions
                  </Button>
                  <Button onClick={() => router.push("/thotis/dashboard")} className="gap-2">
                    <Icon name="users" className="h-4 w-4" />
                    Dashboard Mentor
                  </Button>
                </>
              ) : (
                <>
                  <Button color="minimal" onClick={() => router.push("/auth/signin")}>
                    Sign In
                  </Button>
                  <Button onClick={() => router.push("/auth/signup")}>Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Meet Your Future
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                {" "}
                University
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
              Get real advice from current students in 15-minute sessions.
            </p>
          </div>

          <OrientationIntentForm
            isPending={upsertIntent.isPending}
            onSubmit={async (data) => {
              console.log("Intent data:", data);

              // 1. Save to localStorage for both guest and logged-in users
              localStorage.setItem("thotis_orientation_intent", JSON.stringify(data));

              // 2. Persist to DB if logged in
              if (session) {
                try {
                  await upsertIntent.mutateAsync({
                    targetFields: data.targetFields,
                    academicLevel: data.academicLevel,
                    zone: data.zone,
                    goals: data.goals,
                    scheduleConstraints: data.scheduleConstraints,
                  });
                } catch (error) {
                  console.error("Failed to persist intent:", error);
                }
              }

              // 3. Direct navigation after persistence
              // We no longer pass field/level in params, the mentors page will use the intent
              router.push("/thotis/mentors");
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 border-t border-gray-200 pt-12">
            <div className="space-y-1 text-center">
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <p className="text-sm text-gray-600">Mentors</p>
            </div>
            <div className="space-y-1 text-center">
              <div className="text-3xl font-bold text-gray-900">10K+</div>
              <p className="text-sm text-gray-600">Students Helped</p>
            </div>
            <div className="space-y-1 text-center">
              <div className="text-3xl font-bold text-gray-900">4.8⭐</div>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and transparent</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="search" className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Find a Mentor</h3>
              <p className="text-gray-600">
                Search by field, university, or rating. Find the perfect mentor.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Icon name="calendar" className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Book a Session</h3>
              <p className="text-gray-600">Choose a 15-minute slot. Instant confirmation.</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="video" className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Join & Ask</h3>
              <p className="text-gray-600">Join via Google Meet. Get real advice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Start?</h2>
          <p className="text-xl text-blue-50 max-w-2xl mx-auto">
            Join Thotis today and connect with your community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              color="secondary"
              onClick={handleFindMentors}
              className="gap-2 border-white text-white">
              <Icon name="search" className="h-5 w-5" />
              Find a Mentor
            </Button>
            <Button
              size="lg"
              onClick={handleBecomeMentor}
              className="gap-2 bg-white text-blue-600 hover:bg-blue-50">
              <Icon name="star" className="h-5 w-5" />
              Become a Mentor
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>&copy; 2024 Thotis. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
