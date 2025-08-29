"use client";

import {
  FileUploadSection,
  UsernameWarning,
  LoadingScreen,
} from "@/components";
import {
  CredentialsProvider,
  useCredentials,
} from "@/contexts/CredentialsContext";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppIcon } from "@/app/graphics";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  // Get prefix directly from URL - no local state needed
  const prefix = searchParams.get("prefix") || "";

  const username = prefix.split("/")[0];

  // Show username warning if no username provided
  if (!username) {
    return <UsernameWarning />;
  }

  // Wrap the authenticated content in CredentialsProvider
  return (
    <CredentialsProvider username={username}>
      <AuthenticatedContent username={username} prefix={prefix} />
    </CredentialsProvider>
  );
}

function AuthenticatedContent({
  username,
  prefix,
}: {
  username: string;
  prefix: string;
}) {
  const { loading, error } = useCredentials();

  // Show loading message when credentials are being fetched
  if (loading) {
    return <LoadingScreen username={username} error={error || ""} />;
  }

  // Show main content when not loading
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
              <AppIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <h1 className="mb-3 font-geist text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            File Upload Demo
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            Welcome back,{" "}
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {username}
            </span>
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-black">
          <FileUploadSection prefix={prefix} />
        </div>
      </div>
    </div>
  );
}
