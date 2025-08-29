"use client";

interface LoadingScreenProps {
  username: string;
  error: string;
}

export default function LoadingScreen({ username, error }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          {/* Loading Animation */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-400"></div>
          </div>

          <h1 className="mb-4 font-mono text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Setting up your session
          </h1>

          {error ? (
            <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Getting credentials for{" "}
              <span className="font-mono font-semibold text-gray-900 dark:text-white">
                {username}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
