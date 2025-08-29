"use client";

import Link from "next/link";
import { UserIcon, WarningIcon } from "@/graphics";

interface UsernameWarningProps {
  username?: string;
}

export default function UsernameWarning({ username }: UsernameWarningProps) {
  if (username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          {/* Hero Icon */}
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900">
            <UserIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
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
                <WarningIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
                  href="/?prefix=bob"
                  className="text-black-600 dark:text-black-400 font-semibold"
                >
                  Bob
                </Link>
              </li>
              <li>
                <Link
                  href="/?prefix=alice"
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
