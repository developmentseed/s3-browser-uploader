"use client";

import { FileUploadSection } from "@/components";
import {
  CredentialsProvider,
  useCredentials,
} from "@/contexts/CredentialsContext";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

function HomeContent() {
  const { loading } = useCredentials();
  const searchParams = useSearchParams();
  const username = searchParams.get("user") || undefined;
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!username) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center">
            {/* Hero Icon */}
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900">
              <svg
                className="h-8 w-8 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            {/* Main Heading */}
            <h1 className="mb-4 font-geist text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              S3 Browser Upload
            </h1>

            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
              A secure file upload solution powered by AWS S3
            </p>

            {/* Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-6 flex items-center justify-center">
                <div className="rounded-md bg-yellow-100 p-2 dark:bg-yellow-900/20">
                  <svg
                    className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="mb-4 font-geist text-xl font-semibold text-gray-900 dark:text-white">
                Username Required
              </h2>

              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Please provide a username in the URL to continue.
              </p>

              {origin && (
                <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  Example:
                  <a
                    href={`${origin}/?user=john`}
                    className="text-black-600 dark:text-black-400 font-semibold"
                  >
                    {origin}/?user=john
                  </a>
                </p>
              )}

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                In production, this would be retrieved from a JWT after user
                authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading message when credentials are being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center">
            {/* Loading Animation */}
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-400"></div>
            </div>

            <h1 className="mb-4 font-geist text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Setting up your session
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400">
              Getting credentials for{" "}
              <span className="font-mono font-semibold text-gray-900 dark:text-white">
                {username}
              </span>
            </p>

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main content when not loading
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
              <svg
                className="h-8 w-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
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
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <FileUploadSection />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const searchParams = useSearchParams();

  // Extract username from query parameter (e.g., ?user=john -> john)
  const username = searchParams.get("user") || undefined;

  return (
    <CredentialsProvider initialUsername={username}>
      <HomeContent />
    </CredentialsProvider>
  );
}
