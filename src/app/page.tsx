"use client";

import { LoadingScreen, UploadLogDrawer, FileExplorer } from "@/components";
import {
  UploadProvider,
  PreferencesProvider,
  FSProvider,
  useAuth,
} from "@/contexts";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Session } from "next-auth";

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
  const { user, status } = useAuth();
  const searchParams = useSearchParams();
  const prefix = searchParams.get("prefix");

  // Handle redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && !user) {
      signIn();
    }
  }, [status, user]);

  // Show loading message when auth status is loading
  if (status === "loading") {
    return <LoadingScreen>Checking your auth status...</LoadingScreen>;
  }

  // Show loading while redirecting to login
  if (status === "unauthenticated" || !user) {
    return <LoadingScreen>Redirecting to login...</LoadingScreen>;
  }

  // Show the authenticated content directly
  return <AuthenticatedContent user={user} prefix={prefix || `${user.id}/`} />;
}

function AuthenticatedContent({
  user,
  prefix,
}: {
  user: Session["user"];
  prefix: string;
}) {
  const {
    s3CredentialsLoading,
    s3CredentialsError,
    s3Credentials,
    s3Bucket,
    fetchS3Credentials,
    clearS3CredentialsError,
  } = useAuth();
  const { signOut } = useAuth();

  const handleRetry = () => {
    clearS3CredentialsError();
    fetchS3Credentials();
  };

  const username = user.name || user.email || user.id;

  // Show loading message when S3 credentials are being fetched
  if (s3CredentialsLoading) {
    return (
      <LoadingScreen error={!!s3CredentialsError}>
        {s3CredentialsError ? (
          s3CredentialsError
        ) : (
          <>
            Getting fileserver credentials for{" "}
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {username}
            </span>
          </>
        )}
      </LoadingScreen>
    );
  }

  // Show error message when S3 credentials failed to load
  if (s3CredentialsError) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        {/* Header with Auth Controls */}
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-geist text-xl font-semibold text-gray-900 dark:text-white">
                  S3 Browser Upload
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {username}
                </span>
                <button
                  onClick={signOut}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        <div className="mx-auto max-w-4xl px-6 py-8 flex-shrink-0">
          <div className="text-center">
            <h2 className="mb-3 font-geist text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Unable to Access S3
            </h2>
            <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
              There was an error fetching your S3 credentials. This could be due
              to:
            </p>
            <div className="mb-8 text-left max-w-2xl mx-auto space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <ul className="list-disc list-inside space-y-1">
                <li>Expired authentication token</li>
                <li>Insufficient permissions to access S3</li>
                <li>Temporary AWS service issues</li>
                <li>Network connectivity problems</li>
              </ul>
            </div>
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 font-mono text-sm">
                {s3CredentialsError}
              </p>
            </div>
            <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              <details className="cursor-pointer">
                <summary className="hover:text-gray-700 dark:hover:text-gray-300">
                  Show technical details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-left">
                  <p className="font-mono text-xs break-all">
                    {s3CredentialsError}
                  </p>
                </div>
              </details>
            </div>
            <div className="space-x-4">
              <button
                onClick={handleRetry}
                disabled={s3CredentialsLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s3CredentialsLoading ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  "Try Again"
                )}
              </button>
              <button
                onClick={signOut}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Sign Out & Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main content when credentials are available
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Header with Auth Controls */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-geist text-xl font-semibold text-gray-900 dark:text-white">
                S3 Browser Upload
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {username}
              </span>
              <button
                onClick={signOut}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Large Width */}
      <div className="bg-white dark:bg-black flex-1">
        <div className="mx-auto max-w-6xl px-6">
          {s3Credentials && s3Bucket && (
            <UploadProvider credentials={s3Credentials} bucket={s3Bucket}>
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
