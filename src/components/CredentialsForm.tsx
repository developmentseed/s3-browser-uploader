"use client";

import { useState } from "react";
import { useCredentials } from "@/contexts/CredentialsContext";

export default function CredentialsForm() {
  const [username, setUsername] = useState("");
  const {
    credentials,
    username: authenticatedUsername,
    loading,
    error,
    fetchCredentials,
    clearCredentials,
  } = useCredentials();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCredentials(username);
  };

  const handleLogout = () => {
    clearCredentials();
    setUsername("");
  };

  // Show authentication indicator when credentials exist
  if (credentials && authenticatedUsername) {
    return (
      <div className="mb-8 p-6 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Authenticated as
              </span>
            </div>
            <span className="font-semibold text-black dark:text-white">
              {authenticatedUsername}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Show credentials form when no credentials exist
  return (
    <div className="mb-8 p-6 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-black">
      <h3 className="text-md font-semibold mb-4 text-black dark:text-white">
        Get AWS Credentials
      </h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="px-4 py-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-xs disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Fetching..." : "Fetch Credentials"}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
    </div>
  );
}
