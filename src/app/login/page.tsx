"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trophy, Users } from "lucide-react";
import Loader from "@/shared/components/Loader";
import { useAuth } from "@/shared/contexts/AuthContext";
import LoginForm from "@/features/auth/components/LoginForm";
import APP from "@/config";

const highlights = [
  { icon: Shield, text: "Secure account sessions" },
  { icon: Trophy, text: "Challenge progress tracking" },
  { icon: Users, text: "Team competition ready" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) router.push("/challenges");
  }, [authLoading, user, router]);

  if (authLoading) return <Loader fullscreen />;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border shadow-lg lg:grid-cols-[1fr_400px]">
        <div className="hidden flex-col justify-between bg-muted/30 p-8 lg:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Shield className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">{APP.fullName}</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to continue your CTF journey.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {APP.fullName} &middot; {new Date().getFullYear()}
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
