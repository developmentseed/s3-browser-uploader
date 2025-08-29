"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Credentials {
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
  bucket: string | null;
  loading: boolean;
  error: string | null;
  fetchCredentials: (username: string) => Promise<void>;
  clearCredentials: () => void;
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(
  undefined
);

export function CredentialsProvider({
  children,
  username,
}: {
  children: ReactNode;
  username: string;
}) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [bucket, setBucket] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = async (usernameInput: string) => {
    if (!usernameInput.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError(null);
    setCredentials(null);
    setBucket(null);

    try {
      const response = await fetch("/api/sts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.credentials) {
        setCredentials(data.credentials);
        setBucket(data.bucket || null);
      } else {
        setError(data.error || "Failed to fetch credentials");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${err}`);
      console.error("Error fetching credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearCredentials = () => {
    setCredentials(null);
    setBucket(null);
    setError(null);
  };

  // Auto-fetch credentials when username is provided
  useEffect(() => {
    if (username && !credentials && !loading) {
      fetchCredentials(username);
    }
  }, [username, credentials, loading]);

  return (
    <CredentialsContext.Provider
      value={{
        credentials,
        bucket,
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
