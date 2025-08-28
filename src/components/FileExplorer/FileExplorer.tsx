"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useCredentials } from "@/contexts/CredentialsContext";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { ActionButton } from "../ActionButton";
import { FileItem } from "./FileItem";
import Link from "next/link";

interface S3Object {
  key: string;
  lastModified: string;
  size: number;
  isDirectory: boolean;
}

interface UploadProgress {
  file: File;
  key: string;
  uploadedBytes: number;
  totalBytes: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface S3FileExplorerProps {
  className?: string;
  onFileUpload?: (files: File[]) => void;
  uploadProgress: UploadProgress[];
  disabled?: boolean;
  prefix: string;
  onPrefixChange: (prefix: string) => void;
}

export default function S3FileExplorer({
  className = "",
  onFileUpload,
  uploadProgress = [],
  disabled = false,
  prefix,
  onPrefixChange,
}: S3FileExplorerProps) {
  const { credentials, username, bucket } = useCredentials();
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update prefix when it changes from parent
  useEffect(() => {
    if (prefix && prefix !== "") {
      // Ensure prefix ends with slash
      const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
      if (normalizedPrefix !== prefix) {
        onPrefixChange(normalizedPrefix);
      }
    }
  }, [prefix, onPrefixChange]);

  // Use react-dropzone hook for drag and drop
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files) => {
      if (onFileUpload && !disabled) {
        onFileUpload(files);
      }
    },
    multiple: true,
    noClick: true, // Don't open file browser on click
    disabled: disabled || !onFileUpload,
  });

  // Fetch S3 objects when credentials or prefix changes
  useEffect(() => {
    if (credentials && username && bucket) {
      fetchS3Objects();
    }
  }, [credentials, username, bucket, prefix]);

  // Refresh file list when ALL uploads complete
  useEffect(() => {
    const hasActiveUploads = uploadProgress.some(
      (up) => up.status === "uploading"
    );
    const hasCompletedUploads = uploadProgress.some(
      (up) => up.status === "completed"
    );

    // Only refresh when there are no active uploads AND there are completed uploads
    if (!hasActiveUploads && hasCompletedUploads) {
      // Wait a bit for S3 to be consistent, then refresh
      const timer = setTimeout(() => {
        fetchS3Objects();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  const fetchS3Objects = async () => {
    if (!credentials || !username || !bucket) return;

    setLoading(true);
    setError(null);

    try {
      // Create S3 client with user credentials
      const s3Client = new S3Client({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      // Add username to prefix for S3 calls
      const s3Prefix = `${username}/${prefix}`;

      // List objects with the specified prefix
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: s3Prefix,
        Delimiter: "/",
        MaxKeys: 1000,
      });

      const response = await s3Client.send(command);

      // Process the response to create a clean list of objects
      const objects: S3Object[] = [];

      // Add directories (common prefixes)
      if (response.CommonPrefixes) {
        response.CommonPrefixes.forEach((commonPrefix) => {
          if (commonPrefix.Prefix) {
            // Remove username from the key for display
            const displayKey = commonPrefix.Prefix.replace(`${username}/`, "");
            objects.push({
              key: displayKey,
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
          if (content.Key && content.Key !== s3Prefix) {
            // Remove username from the key for display
            const displayKey = content.Key.replace(`${username}/`, "");
            objects.push({
              key: displayKey,
              lastModified:
                content.LastModified?.toISOString() || new Date().toISOString(),
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

      setObjects([...directories, ...files]);
    } catch (err) {
      setError("Failed to fetch S3 objects");
      console.error("Error fetching S3 objects:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDirectory = (directoryKey: string) => {
    onPrefixChange(directoryKey);
  };

  const navigateUp = () => {
    if (prefix !== "") {
      const parentPrefix = prefix.split("/").slice(0, -2).join("/") + "/";
      onPrefixChange(parentPrefix);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (
    dateString: string
  ): { relative: string; absolute: string } => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    let relative = "";
    if (diffInSeconds < 60) {
      relative = "Just now";
    } else if (diffInMinutes < 60) {
      relative = `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    } else if (diffInHours < 24) {
      relative = `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else if (diffInDays < 7) {
      relative = `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    } else if (diffInWeeks < 4) {
      relative = `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
    } else if (diffInMonths < 12) {
      relative = `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
    } else {
      relative = `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
    }

    const absolute = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return { relative, absolute };
  };

  const getDisplayName = (key: string): string => {
    const parts = key.split("/");
    return parts[parts.length - 1] || key;
  };

  const getUploadProgress = (fileName: string): UploadProgress | undefined => {
    return uploadProgress.find((up) => up.file.name === fileName);
  };

  // Create unified file list combining S3 objects and uploads
  const getUnifiedFileList = (): FileItem[] => {
    const fileItems: FileItem[] = [];

    // Add S3 objects
    objects.forEach((obj) => {
      fileItems.push({
        key: obj.key,
        name: getDisplayName(obj.key),
        lastModified: obj.lastModified,
        size: obj.size,
        isDirectory: obj.isDirectory,
        isUpload: false,
      });
    });

    // Add uploads
    uploadProgress.forEach((upload) => {
      const uploadKey = upload.key;
      const uploadName = getDisplayName(uploadKey);

      // Check if this upload has a corresponding S3 object (completed upload)
      const existingS3Object = objects.find((obj) => obj.key === uploadKey);

      if (existingS3Object) {
        // Upload completed, show as regular file with recent timestamp
        fileItems.push({
          key: uploadKey,
          name: uploadName,
          lastModified: new Date().toISOString(), // Very recent timestamp
          size: upload.totalBytes,
          isDirectory: false,
          isUpload: false, // No longer an upload
        });
      } else {
        // Still uploading or failed
        fileItems.push({
          key: uploadKey,
          name: uploadName,
          lastModified: new Date().toISOString(),
          size: upload.totalBytes,
          isDirectory: false,
          isUpload: true,
          uploadStatus: upload.status,
          uploadProgress:
            upload.status === "uploading"
              ? (upload.uploadedBytes / upload.totalBytes) * 100
              : undefined,
          uploadError: upload.error,
        });
      }
    });

    // Sort alphabetically, directories first
    return fileItems.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  if (!credentials || !username || !bucket) {
    console.log({ credentials, username, bucket });
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Uh oh, something went wrong.
      </div>
    );
  }

  return (
    <div className="space-y-4" {...getRootProps()}>
      {/* S3 File Explorer - shown when not disabled */}
      {!disabled && (
        <div className={`space-y-4 ${className} relative`}>
          {/* Drag and Drop Overlay */}
          {isDragActive && (
            <div
              className={`
                ${className} absolute inset-0 
                bg-blue-500/10 dark:bg-blue-400/10 
                border-2 border-dashed border-blue-500 dark:border-blue-400 
                z-10 flex items-center justify-center`}
            >
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-lg font-medium text-blue-700 dark:text-blue-300">
                  Drop files here to upload
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Files will be uploaded to: {prefix}
                </div>
              </div>
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-400">
            <button
              onClick={() => onPrefixChange("")}
              className="font-mono hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {username}
            </button>
            {prefix !== "" && (
              <>
                <span>/</span>
                {prefix
                  .split("/")
                  .filter(Boolean)
                  .map((segment, index) => {
                    const newPrefix =
                      prefix
                        .split("/")
                        .filter(Boolean)
                        .slice(0, index + 1)
                        .join("/") + "/";
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <Link
                          href={`/?user=${username}&prefix=${newPrefix}`}
                          className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          {segment}
                        </Link>
                        {index <
                          prefix.split("/").filter(Boolean).length - 1 && (
                          <span>/</span>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>

          {/* Back Button and Refresh */}
          <div className="flex items-center gap-2">
            {prefix !== "" && (
              <ActionButton
                onClick={navigateUp}
                disabled={loading}
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                }
              >
                Back
              </ActionButton>
            )}

            <ActionButton
              onClick={fetchS3Objects}
              loading={loading}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              }
            >
              Refresh
            </ActionButton>

            <ActionButton
              onClick={open}
              disabled={disabled}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              }
            >
              Upload Files
            </ActionButton>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              {error}
            </div>
          )}

          {/* File List */}
          <div className="space-y-0.5 font-mono">
            {getUnifiedFileList().length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                This directory is empty
              </div>
            ) : (
              getUnifiedFileList().map((item) => (
                <FileItem
                  key={item.key}
                  item={item}
                  onNavigateToDirectory={navigateToDirectory}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
          <input {...getInputProps()} />
        </div>
      )}
    </div>
  );
}
