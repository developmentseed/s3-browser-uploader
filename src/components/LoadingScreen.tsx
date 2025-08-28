"use client";

interface LoadingScreenProps {
  username: string;
}

export default function LoadingScreen({ username }: LoadingScreenProps) {
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
