"use client";

import { LoadingIcon } from "./graphics";

interface LoadingScreenProps {
  error?: boolean;
  children?: React.ReactNode;
}

export function LoadingScreen({ error, children }: LoadingScreenProps) {
  const color = error ? "red" : "gray";
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          {/* Loading Animation */}
          <LoadingIcon />

          <p className={`text-lg text-${color}-600 dark:text-${color}-400`}>
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}
