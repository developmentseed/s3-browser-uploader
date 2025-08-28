"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

interface CredentialsContextType {
  credentials: Credentials | null;
  loading: boolean;
  error: string | null;
  fetchCredentials: (username: string) => Promise<void>;
  clearCredentials: () => void;
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = async (username: string) => {
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

  const clearCredentials = () => {
    setCredentials(null);
    setError(null);
  };

  return (
    <CredentialsContext.Provider
      value={{
        credentials,
        loading,
        error,
        fetchCredentials,
        clearCredentials,
      }}
    >
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const context = useContext(CredentialsContext);
  if (context === undefined) {
    throw new Error("useCredentials must be used within a CredentialsProvider");
  }
  return context;
}
