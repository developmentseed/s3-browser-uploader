"use client";

import { FileDropZone } from "@/components";
import { useState } from "react";

interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
  region: string;
}

interface ApiResponse {
  success: boolean;
  credentials?: Credentials;
  bucket?: string;
  prefix?: string;
  error?: string;
  details?: string;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    console.log("Selected files:", files);
    // Here you would typically handle the file upload to S3
    alert(
      `Selected ${files.length} file(s): ${files.map((f) => f.name).join(", ")}`
    );
  };

  const fetchCredentials = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError(null);
    setCredentials(null);

    try {
      const response = await fetch("/api/sts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.credentials) {
        setCredentials(data.credentials);
      } else {
        setError(data.error || "Failed to fetch credentials");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-mono grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-center mb-6">
            File Upload Demo
          </h2>

          {/* Credentials Form */}
          <div className="mb-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
              Get AWS Credentials
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={fetchCredentials}
                disabled={loading || !username.trim()}
                className="px-4 py-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-md disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Fetching..." : "Fetch Credentials"}
              </button>
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            {credentials && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-black dark:text-white">
                  Credentials:
                </h4>
                <pre className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-black dark:text-white p-4 rounded-md overflow-x-auto text-sm">
                  <code>{JSON.stringify(credentials, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          <FileDropZone
            onFilesSelected={handleFilesSelected}
            multiple={true}
            className="mb-8"
          />
        </div>
      </main>
    </div>
  );
}
