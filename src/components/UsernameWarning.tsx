"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface UsernameWarningProps {
  username?: string;
}

export default function UsernameWarning({ username }: UsernameWarningProps) {
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (username) {
    return null;
  }

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
            Try one of these:
            <ul>
              <li>
                <Link
                  href="/?user=bob"
                  className="text-black-600 dark:text-black-400 font-semibold"
                >
                  Bob
                </Link>
              </li>
              <li>
                <Link
                  href="/?user=alice"
                  className="text-black-600 dark:text-black-400 font-semibold"
                >
                  Alice
                </Link>
              </li>
            </ul>
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
