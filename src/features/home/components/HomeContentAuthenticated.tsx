"use client";
import {
  LoadingScreen,
  S3AccessError,
} from "@/shared/components";
import { FileExplorer, UploadLogDrawer } from "@/features/file-management";
import { useAuth } from "@/features/auth";
import { Session } from "next-auth";

export function HomeContentAuthenticated({
  user,
  prefix,
}: {
  user: Session["user"];
  prefix: string;
}) {
  const {
    s3CredentialsLoading,
    s3CredentialsError,
    s3Credentials,
    s3Bucket,
    fetchS3Credentials,
    clearS3CredentialsError,
  } = useAuth();
  const { signOut } = useAuth();

  const handleRetry = () => {
    clearS3CredentialsError();
    fetchS3Credentials();
  };

  const username = user.name || user.email || user.id;

  // Show loading message when S3 credentials are being fetched
  if (s3CredentialsLoading) {
    return (
      <LoadingScreen error={!!s3CredentialsError}>
        {s3CredentialsError || (
          <>
            Getting fileserver credentials for{" "}
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {username}
            </span>
          </>
        )}
      </LoadingScreen>
    );
  }

  // Show error message when S3 credentials failed to load
  if (s3CredentialsError) {
    return (
      <S3AccessError
        error={s3CredentialsError}
        loading={s3CredentialsLoading}
        onRetry={handleRetry}
        onSignOut={signOut}
      />
    );
  }

  // Show main content when credentials are available
  return (
    <div className="bg-white dark:bg-black flex-1">
      <div className="mx-auto max-w-6xl px-6">
        {s3Credentials && s3Bucket && (
          <>
            <FileExplorer prefix={prefix} />
            <UploadLogDrawer />
          </>
        )}
      </div>
    </div>
  );
}
