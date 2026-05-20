"use client";

import { useAuth } from "@/shared/contexts/AuthContext";
import Loader from "@/shared/components/Loader";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { PlatformStats } from "@/features/landing/components/PlatformStats";
import { FeatureGrid } from "@/features/landing/components/FeatureGrid";

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullscreen />;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <LandingHero authenticated={Boolean(user)} />
      <div className="flex flex-col gap-16 py-16">
        <PlatformStats />
        <FeatureGrid />
      </div>
    </main>
  );
}
