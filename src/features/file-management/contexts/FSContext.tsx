"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { usePreferences } from "@/features/preferences/contexts/PreferencesContext";

// File System Types
interface FSObject {
  key: string; // Full S3 key (with prefix)
  lastModified: string;
  size: number;
  isDirectory: boolean;
}

// Upload Types
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

// Combined Context Type
interface FileSystemContextType {
  // File System Operations
  listObjects: (prefix: string) => Promise<FSObject[]>;
  deleteObject: (key: string) => Promise<void>;

  // Upload Operations - grouped into a single object
  uploads: {
    progress: UploadProgress[];
    uploadFiles: (files: File[], prefix: string) => Promise<void>;
    cancelUpload: (id: string) => void;
    cancelAllUploads: () => void;
    retryUpload: (id: string) => Promise<void>;
    clearCompleted: () => void;
    clearErrors: () => void;
    removeCancelled: () => void;
    clearAllUploads: () => void;
    isUploading: boolean;
    hasActiveUploads: boolean;
  };
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(
  undefined
);

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
  }
  return context;
};

// Keep the old hook for backward compatibility
export const useFS = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error("useFS must be used within a FileSystemProvider");
  }
  return context;
};

interface FileSystemProviderProps {
  children: ReactNode;
}

export const FileSystemProvider: React.FC<FileSystemProviderProps> = ({
  children,
}) => {
  const { s3Credentials, s3Bucket } = useAuth();
  const { preferences } = usePreferences();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const uploadProgressRef = useRef<UploadProgress[]>([]);

  // Keep ref in sync with state
  uploadProgressRef.current = uploadProgress;

  // Computed properties
  const isUploading = uploadProgress.some((up) => up.status === "uploading");
  const hasActiveUploads = uploadProgress.some(
    (up) => up.status === "uploading"
  );

  // Memoized S3 Client - only recreates when credentials change
  const s3Client = useMemo((): S3Client | null => {
    if (!s3Credentials || !s3Bucket) return null;

    return new S3Client({
      region: s3Credentials.region,
      credentials: {
        accessKeyId: s3Credentials.accessKeyId,
        secretAccessKey: s3Credentials.secretAccessKey,
        sessionToken: s3Credentials.sessionToken,
      },
    });
  }, [s3Credentials, s3Bucket]);

  // File System Operations
  const listObjects = useCallback(
    async (prefix: string): Promise<FSObject[]> => {
      if (!s3Client) {
        throw new Error("File system client not available");
      }

      try {
        // List objects with the specified prefix
        const command = new ListObjectsV2Command({
          Bucket: s3Bucket!,
          Prefix: prefix.endsWith("/") ? prefix : `${prefix}/`,
          Delimiter: "/",
          MaxKeys: 1000,
        });

        const response = await s3Client.send(command);

        // Process the response to create a clean list of objects
        const objects: FSObject[] = [];

        // Add directories (common prefixes)
        if (response.CommonPrefixes) {
          response.CommonPrefixes.forEach((commonPrefix) => {
            if (commonPrefix.Prefix) {
              objects.push({
                key: commonPrefix.Prefix,
                lastModified: new Date().toISOString(), // Directories don't have lastModified
                size: 0,
                isDirectory: true,
              });
            }
          });
        }

        // Add files
        if (response.Contents) {
          response.Contents.forEach((content) => {
            if (content.Key && content.Key !== prefix) {
              objects.push({
                key: content.Key,
                lastModified:
                  content.LastModified?.toISOString() ||
                  new Date().toISOString(),
                size: content.Size || 0,
                isDirectory: false,
              });
            }
          });
        }

        // Group by directories and files
        const directories = objects
          .filter((obj) => obj.isDirectory)
          .sort((a, b) => a.key.localeCompare(b.key));

        const files = objects
          .filter((obj) => !obj.isDirectory)
          .sort((a, b) => a.key.localeCompare(b.key));

        return [...directories, ...files];
      } catch (error) {
        console.error("Error listing file system objects:", error);
        throw new Error("Failed to fetch file system objects");
      }
    },
    [s3Client, s3Bucket]
  );

  const deleteObject = useCallback(
    async (key: string): Promise<void> => {
      if (!s3Client) {
        throw new Error("File system client not available");
      }

      try {
        // Delete the object
        const command = new DeleteObjectCommand({
          Bucket: s3Bucket!,
          Key: key,
        });

        await s3Client.send(command);
      } catch (error) {
        console.error("Error deleting file system object:", error);
        throw new Error("Failed to delete object");
      }
    },
    [s3Client, s3Bucket]
  );

  // Upload Operations
  const uploadFiles = useCallback(
    async (files: File[], prefix: string) => {
      if (!s3Bucket || !s3Client) {
        console.log("No bucket or client available, file upload disabled");
        return;
      }

      const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

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

      // Process uploads concurrently with a sliding window approach
      const maxConcurrent = preferences.concurrentFileUploads;
      const queue = [...initialProgress];
      const activeUploads = new Set<string>();
      const uploadPromises: Promise<void>[] = [];

      // Function to start a single upload
      const startUpload = async (progress: UploadProgress): Promise<void> => {
        try {
          const currentProgress = uploadProgressRef.current.find(
            (up) => up.id === progress.id
          );

          if (currentProgress?.status === "cancelled") {
            return;
          }

          setUploadProgress((prev) =>
            prev.map((up) =>
              up.id === progress.id ? { ...up, status: "uploading" } : up
            )
          );

          const chunkSize = 1024 * 1024 * 5;
          const isLargeFile = progress.file.size > chunkSize;

          const upload = new Upload({
            client: s3Client,
            params: {
              Bucket: s3Bucket,
              Key: progress.key,
              Body: progress.file,
              ContentType: progress.file.type || "application/octet-stream",
              ...(isLargeFile && { ChecksumAlgorithm: "CRC32" }),
            },
            queueSize: preferences.uploadQueueSize,
            partSize: isLargeFile ? chunkSize : undefined,
            leavePartsOnError: false,
          });

          setUploadProgress((prev) =>
            prev.map((up) => (up.id === progress.id ? { ...up, upload } : up))
          );

          upload.on("httpUploadProgress", (progressEvent) => {
            setUploadProgress((prev) =>
              prev.map((up) =>
                up.id === progress.id
                  ? { ...up, uploadedBytes: progressEvent.loaded || 0 }
                  : up
              )
            );
          });

          await upload.done();

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

          let errorMessage = "Unknown error";
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          const isCancellationError = errorMessage.includes("aborted");
          const status = isCancellationError ? "cancelled" : "error";

          setUploadProgress((prev) =>
            prev.map((up) =>
              up.id === progress.id
                ? { ...up, status, error: errorMessage }
                : up
            )
          );
        } finally {
          // Remove from active uploads when done (success or failure)
          activeUploads.delete(progress.id);
          
          // Start the next upload from the queue if available
          if (queue.length > 0) {
            const nextProgress = queue.shift()!;
            activeUploads.add(nextProgress.id);
            uploadPromises.push(startUpload(nextProgress));
          }
        }
      };

      // Start initial batch of uploads up to maxConcurrent
      const initialBatch = queue.splice(0, maxConcurrent);
      initialBatch.forEach((progress) => {
        activeUploads.add(progress.id);
        uploadPromises.push(startUpload(progress));
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
    },
    [s3Bucket, s3Client, preferences.uploadQueueSize, preferences.concurrentFileUploads]
  );

  const cancelUpload = useCallback((id: string) => {
    setUploadProgress((prev) =>
      prev.map((up) =>
        up.id === id && ["queued", "uploading"].includes(up.status)
          ? markUploadAsCancelled(up)
          : up
      )
    );
  }, []);

  const cancelAllUploads = useCallback(() => {
    setUploadProgress((prev) =>
      prev.map((up) =>
        ["queued", "uploading"].includes(up.status)
          ? markUploadAsCancelled(up)
          : up
      )
    );
  }, []);

  const retryUpload = useCallback(
    async (id: string) => {
      const uploadItem = uploadProgress.find((up) => up.id === id);
      if (
        !uploadItem ||
        (uploadItem.status !== "error" && uploadItem.status !== "cancelled")
      ) {
        return;
      }

      setUploadProgress((prev) => prev.filter((up) => up.id !== id));

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

  const value: FileSystemContextType = {
    // File System Operations
    listObjects,
    deleteObject,

    // Upload Operations - grouped into a single object
    uploads: {
      progress: uploadProgress,
      uploadFiles,
      cancelUpload,
      cancelAllUploads,
      retryUpload,
      clearCompleted,
      clearErrors,
      removeCancelled,
      clearAllUploads,
      isUploading,
      hasActiveUploads,
    },
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};

// Keep the old provider for backward compatibility
export const FSProvider = FileSystemProvider;

// Helper function
function markUploadAsCancelled(upload: UploadProgress): UploadProgress {
  console.log(
    `Cancelling upload: ${upload.file.name} (${upload.id} - ${upload.status})`
  );
  if (upload.status === "uploading" && upload.upload) {
    upload.upload.abort();
  }
  return {
    ...upload,
    status: "cancelled",
    error: "Upload cancelled",
  };
}
