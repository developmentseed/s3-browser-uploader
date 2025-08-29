"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Credentials } from "./CredentialsContext";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";

interface UploadProgress {
  id: string;
  file: File;
  key: string;
  uploadedBytes: number;
  totalBytes: number;
  status: "queued" | "uploading" | "completed" | "error" | "cancelled";
  error?: string;
  upload?: Upload;
  queuePosition?: number;
}

interface UploadContextType {
  uploadProgress: UploadProgress[];
  uploadFiles: (files: File[], prefix: string) => Promise<void>;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => Promise<void>;
  clearCompleted: () => void;
  clearErrors: () => void;
  removeCancelled: () => void;
  clearAllUploads: () => void;
  isUploading: boolean;
  hasActiveUploads: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({
  children,
  credentials,
  bucket,
}: {
  children: ReactNode;
  credentials: Credentials;
  bucket: string;
}) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const isUploading = uploadProgress.some((up) => up.status === "uploading");
  const hasActiveUploads = uploadProgress.some(
    (up) => up.status === "uploading"
  );

  const uploadFiles = useCallback(
    async (files: File[], prefix: string) => {
      // Early return if no credentials are available
      if (!credentials || !bucket) {
        console.log("No credentials available, file upload disabled");
        return;
      }

      // Create S3 client with user credentials
      const s3Client = new S3Client({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      // Normalize prefix to ensure it ends with slash
      const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

      // Initialize upload progress for each file as queued
      const initialProgress: UploadProgress[] = files.map((file, index) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        key: `${normalizedPrefix}${file.name}`,
        uploadedBytes: 0,
        totalBytes: file.size,
        status: "queued",
        queuePosition: index + 1,
      }));

      setUploadProgress((prev) => [...prev, ...initialProgress]);

      // Process uploads sequentially
      for (const progress of initialProgress) {
        try {
          // Update status to uploading
          setUploadProgress((prev) =>
            prev.map((up) =>
              up.id === progress.id ? { ...up, status: "uploading" } : up
            )
          );

          const upload = new Upload({
            client: s3Client,
            params: {
              Bucket: bucket,
              Key: progress.key,
              Body: progress.file,
              ContentType: progress.file.type || "application/octet-stream",
              ChecksumAlgorithm: "CRC32",
            },
            queueSize: 8,
            partSize: 1024 * 1024 * 5, // 5MB chunks
            leavePartsOnError: false,
          });

          // Store the upload instance for potential cancellation
          setUploadProgress((prev) =>
            prev.map((up) => (up.id === progress.id ? { ...up, upload } : up))
          );

          // Track upload progress
          upload.on("httpUploadProgress", (progressEvent) => {
            setUploadProgress((prev) =>
              prev.map((up) =>
                up.id === progress.id
                  ? { ...up, uploadedBytes: progressEvent.loaded || 0 }
                  : up
              )
            );
          });

          // Start the upload
          await upload.done();

          // Mark as completed
          setUploadProgress((prev) =>
            prev.map((up) =>
              up.id === progress.id
                ? { ...up, status: "completed" as const }
                : up
            )
          );

          console.log(
            `File ${progress.file.name} uploaded successfully to ${progress.key}`
          );
        } catch (error) {
          console.error(`Error uploading ${progress.file.name}:`, error);

          // Handle specific checksum errors
          let errorMessage = "Unknown error";
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          // Check if this is a cancellation-related error from AWS
          const isCancellationError = errorMessage.includes("aborted");

          // Mark as cancelled if it's a cancellation error, otherwise as error
          const status = isCancellationError ? "cancelled" : "error";

          setUploadProgress((prev) =>
            prev.map((up) =>
              up.id === progress.id
                ? {
                    ...up,
                    status,
                    error: errorMessage,
                  }
                : up
            )
          );
        }
      }
    },
    [credentials, bucket]
  );

  const cancelUpload = useCallback((id: string) => {
    setUploadProgress((prev) =>
      prev.map((up) => {
        if (up.id === id) {
          if (up.status === "uploading" && up.upload) {
            up.upload.abort();
          }
          return {
            ...up,
            status: "cancelled" as const,
            error: "Upload cancelled",
          };
        }
        return up;
      })
    );
  }, []);

  const retryUpload = useCallback(
    async (id: string) => {
      const uploadItem = uploadProgress.find((up) => up.id === id);
      if (
        !uploadItem ||
        (uploadItem.status !== "error" && uploadItem.status !== "cancelled")
      )
        return;

      // Remove the failed/cancelled upload and retry with the same file
      setUploadProgress((prev) => prev.filter((up) => up.id !== id));

      // Extract prefix from the key (remove filename)
      const keyParts = uploadItem.key.split("/");
      const prefix = keyParts.slice(0, -1).join("/");

      await uploadFiles([uploadItem.file], prefix);
    },
    [uploadProgress, uploadFiles]
  );

  const clearCompleted = useCallback(() => {
    setUploadProgress((prev) => prev.filter((up) => up.status !== "completed"));
  }, []);

  const clearErrors = useCallback(() => {
    setUploadProgress((prev) => prev.filter((up) => up.status !== "error"));
  }, []);

  const removeCancelled = useCallback(() => {
    setUploadProgress((prev) => prev.filter((up) => up.status !== "cancelled"));
  }, []);

  const clearAllUploads = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return (
    <UploadContext.Provider
      value={{
        uploadProgress,
        uploadFiles,
        cancelUpload,
        retryUpload,
        clearCompleted,
        clearErrors,
        removeCancelled,
        clearAllUploads,
        isUploading,
        hasActiveUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
