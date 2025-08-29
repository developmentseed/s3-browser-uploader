"use client";

import {
  UsernameWarning,
  LoadingScreen,
  UploadLogDrawer,
  FileExplorer,
} from "@/components";
import {
  CredentialsProvider,
  useCredentials,
  UploadProvider,
  PreferencesProvider,
  FSProvider,
} from "@/contexts";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function Home() {
  return (
    <PreferencesProvider>
      <Suspense>
        <HomeContent />
      </Suspense>
    </PreferencesProvider>
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
  const { loading, error, credentials, bucket } = useCredentials();

  // Show loading message when credentials are being fetched
  if (loading) {
    return <LoadingScreen username={username} error={error || ""} />;
  }

  // Show main content when not loading
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <div className="mx-auto max-w-4xl px-6 py-8 flex-shrink-0">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-12">
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
      </div>

      {/* Main Content - Large Width */}
      <div className="bg-white dark:bg-black flex-1">
        <div className="mx-auto max-w-6xl px-6">
          {credentials && bucket && (
            <UploadProvider credentials={credentials} bucket={bucket}>
              <FSProvider>
                <FileExplorer prefix={prefix} />
                <UploadLogDrawer />
              </FSProvider>
            </UploadProvider>
          )}
        </div>
      </div>
    </div>
  );
}
