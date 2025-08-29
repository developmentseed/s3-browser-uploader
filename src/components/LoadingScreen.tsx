"use client";

interface LoadingScreenProps {
  error?: boolean;
  children?: React.ReactNode;
}

export default function LoadingScreen({ error, children }: LoadingScreenProps) {
  const color = error ? "red" : "gray";
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          {/* Loading Animation */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-400"></div>
          </div>

          <h1 className="mb-4 font-mono text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Fetching your session
          </h1>

          <p className={`text-lg text-${color}-600 dark:text-${color}-400`}>
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}
