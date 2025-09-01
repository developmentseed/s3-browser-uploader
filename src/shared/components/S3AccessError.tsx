"use client";

interface S3AccessErrorProps {
  error: string;
  loading: boolean;
  onRetry: () => void;
  onSignOut: () => void;
}

export function S3AccessError({
  error,
  loading,
  onRetry,
  onSignOut,
}: S3AccessErrorProps) {
  return (
    <div className="fixed inset-0 flex flex-col justify-center z-50">
      {/* Error Display */}
      <div className="mx-auto max-w-4xl px-6 py-8 -mt-8">
        <div className="text-center">
          <h2 className="mb-3 font-geist text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Unable to get fileserver credentials
          </h2>
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
            There was an error fetching your S3 credentials.
          </p>
          <div className="mb-4 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-left text-xs text-gray-500 dark:text-gray-400">
            <p className="text-red-800 dark:text-red-200 font-mono text-sm">
              {error}
            </p>
          </div>
          <div className="space-x-4">
            <button
              onClick={onRetry}
              disabled={loading}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Retrying...
                </>
              ) : (
                "Try Again"
              )}
            </button>
            <button
              onClick={onSignOut}
              className="px-3 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Sign Out & Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
