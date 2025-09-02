"use client";

import { LoadingScreen, Header } from "@/shared/components";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { HomeContentAuthenticated } from "./HomeContentAuthenticated";

export function HomeContent() {
  const { user, status } = useAuth();
  const searchParams = useSearchParams();
  const prefix = searchParams.get("prefix");

  // Handle redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && !user) {
      signIn("oidc");
    }
  }, [status, user]);

  const username = user?.name || user?.email || user?.id;

  // Always show the header, content below changes based on status
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Header username={username} onSignOut={signIn} />

      {/* Content area - changes based on authentication status */}
      <div className="flex-1">
        {status === "authenticated" ? (
          <HomeContentAuthenticated
            user={user!}
            prefix={prefix || `${user!.id}/`}
          />
        ) : (
          <LoadingScreen>
            {status === "loading"
              ? "Checking your auth status..."
              : "Redirecting to login..."}
          </LoadingScreen>
        )}
      </div>
    </div>
  );
}
