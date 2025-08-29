"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession, signOut } from "next-auth/react";
import { Session } from "next-auth";

export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
  region: string;
}

interface ApiResponse {
  success: boolean;
  credentials?: S3Credentials;
  bucket?: string;
  prefix?: string;
  error?: string;
  details?: string;
}

interface AuthContextType {
  // Auth state
  accessToken: string | null;
  user: Session["user"] | null;
  isAuthenticated: boolean;
  status: "loading" | "authenticated" | "unauthenticated";

  // S3 File Server state
  s3Credentials: S3Credentials | null;
  s3Bucket: string | null;
  s3CredentialsLoading: boolean;
  s3CredentialsError: string | null;

  // Actions
  fetchS3Credentials: () => Promise<void>;
  clearS3Credentials: () => void;
  clearS3CredentialsError: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // S3 File Server state
  const [s3Credentials, setS3Credentials] = useState<S3Credentials | null>(
    null
  );
  const [s3Bucket, setS3Bucket] = useState<string | null>(null);
  const [s3CredentialsLoading, setS3CredentialsLoading] = useState(false);
  const [s3CredentialsError, setS3CredentialsError] = useState<string | null>(
    null
  );

  useEffect(() => {
    setIsAuthenticated(status === "authenticated" && !!session?.accessToken);
  }, [status, session?.accessToken]);

  const fetchS3Credentials = async () => {
    if (!session?.accessToken) {
      setS3CredentialsError("No access token available");
      return;
    }

    setS3CredentialsLoading(true);
    setS3CredentialsError(null); // Clear any existing errors
    setS3Credentials(null);
    setS3Bucket(null);

    try {
      const response = await fetch("/api/sts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.credentials) {
        setS3Credentials(data.credentials);
        setS3Bucket(data.bucket || null);
      } else {
        // Provide more user-friendly error messages
        const errorMessage = getFriendlyErrorMessage(
          data.error || "Failed to fetch S3 credentials"
        );
        setS3CredentialsError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${err}`;
      setS3CredentialsError(getFriendlyErrorMessage(errorMessage));
      console.error("Error fetching S3 credentials:", err);
    } finally {
      setS3CredentialsLoading(false);
    }
  };

  // Helper function to provide user-friendly error messages
  const getFriendlyErrorMessage = (error: string): string => {
    if (error.includes("JWTExpired") || error.includes("expired")) {
      return "Your login session has expired. Please sign out and sign in again.";
    }
    if (error.includes("Invalid or expired token")) {
      return "Your authentication token is invalid or expired. Please sign out and sign in again.";
    }
    if (error.includes("Failed to get temporary credentials")) {
      return "Unable to get AWS credentials. This may be due to insufficient permissions or AWS service issues.";
    }
    if (error.includes("Failed to get credentials from STS")) {
      return "AWS STS service failed to provide credentials. Please try again or contact support.";
    }
    return error;
  };

  const clearS3Credentials = () => {
    setS3Credentials(null);
    setS3Bucket(null);
    setS3CredentialsError(null);
  };

  const clearS3CredentialsError = () => {
    setS3CredentialsError(null);
  };

  const handleSignOut = () => {
    clearS3Credentials();
    signOut({ callbackUrl: "/" });
  };

  // Auto-fetch S3 credentials when authenticated
  useEffect(() => {
    if (
      isAuthenticated &&
      session?.accessToken &&
      !s3Credentials &&
      !s3CredentialsLoading &&
      !s3CredentialsError // Don't retry if there's an error
    ) {
      fetchS3Credentials();
    }
  }, [
    isAuthenticated,
    session?.accessToken,
    s3Credentials,
    s3CredentialsLoading,
    s3CredentialsError, // Add error to dependencies
  ]);

  const value: AuthContextType = {
    // Auth state
    accessToken: session?.accessToken || null,
    user: session?.user || null,
    isAuthenticated,
    status,

    // S3 File Server state
    s3Credentials,
    s3Bucket,
    s3CredentialsLoading,
    s3CredentialsError,

    // Actions
    fetchS3Credentials,
    clearS3Credentials,
    clearS3CredentialsError,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
