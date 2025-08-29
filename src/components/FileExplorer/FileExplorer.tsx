"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useCredentials } from "@/contexts/CredentialsContext";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { ActionButton } from "../ActionButton";
import { FileDisplay } from "./FileDisplay";
import Link from "next/link";
import { UploadFilesIcon, RefreshIcon } from "@/app/graphics";
import { useUpload } from "@/contexts";

interface S3Object {
  key: string;
  lastModified: string;
  size: number;
  isDirectory: boolean;
}
export interface FileItem {
  key: string;
  name: string;
  lastModified: string;
  size: number;
  isDirectory: boolean;
  isUpload: boolean;
  uploadStatus?: "uploading" | "completed" | "error";
  uploadProgress?: number;
  uploadError?: string;
  uploadId?: string;
}

interface FileExplorerProps {
  className?: string;
  disabled?: boolean;
  prefix: string;
}

export default function FileExplorer({
  className = "",
  disabled = false,
  prefix,
}: FileExplorerProps) {
  const { credentials, bucket } = useCredentials();
  const { uploadFiles, uploadProgress } = useUpload();

  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use react-dropzone hook for drag and drop
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files) => {
      if (disabled) return;
      uploadFiles(files, prefix);
    },
    multiple: true,
    noClick: true, // Don't open file browser on click
    disabled,
  });

  // Fetch S3 objects when credentials or prefix changes
  useEffect(() => {
    if (credentials && bucket) {
      fetchS3Objects();
    }
  }, [credentials, bucket, prefix]);

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
    if (!credentials || !bucket) return;

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

      // List objects with the specified prefix
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix.endsWith("/") ? prefix : `${prefix}/`,
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
            // const displayKey = commonPrefix.Prefix.replace(`${username}/`, "");
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
            // Remove username from the key for display
            const displayKey = content.Key.replace(`${prefix}/`, "");
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

  const getDisplayName = (key: string): string => {
    return key.replace(/\/$/, "").split("/").pop()!;
  };

  // Create unified file list combining S3 objects and uploads
  const unifiedFileList: FileItem[] = Object.values(
    Object.fromEntries([
      // S3 Objects
      ...objects.map((obj): [string, FileItem] => [
        obj.key,
        {
          key: obj.key,
          name: getDisplayName(obj.key),
          lastModified: obj.lastModified,
          size: obj.size,
          isDirectory: obj.isDirectory,
          isUpload: false,
        },
      ]),
      // Uploads in Prefix (possibly overwriting existing S3 objects)
      ...uploadProgress
        .filter(
          (upload) =>
            upload.key.startsWith(prefix) &&
            !upload.key.slice(prefix.length).includes("/")
        )
        .map((upload): [string, FileItem] => [
          upload.key,
          {
            key: upload.key,
            name: getDisplayName(upload.key),
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
            uploadId: upload.id,
          },
        ]),
    ])
  ).sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  if (!credentials || !bucket) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Uh oh, something went wrong when fetching your credentials. Please try
        again.
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
                <UploadFilesIcon className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-blue-700 dark:text-blue-300">
                  Drop files here to upload
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Files will be uploaded to: {prefix}
                </div>
              </div>
            </div>
          )}

          {/* Breadcrumb Navigation and Buttons */}
          <div className="flex items-center justify-between p-2">
            {/* Breadcrumb Navigation */}
            <div className="flex font-mono items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              {prefix
                .split("/")
                .filter(Boolean)
                .map((segment, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <Link
                      href={`/?prefix=${
                        prefix
                          .split("/")
                          .filter(Boolean)
                          .slice(0, index + 1)
                          .join("/") + "/"
                      }`}
                      className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      {segment}
                    </Link>
                    {index < prefix.split("/").filter(Boolean).length - 1 && (
                      <span>/</span>
                    )}
                  </span>
                ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <ActionButton
                onClick={fetchS3Objects}
                loading={loading}
                icon={<RefreshIcon className="w-4 h-4" />}
              >
                Refresh
              </ActionButton>

              <ActionButton
                onClick={open}
                disabled={disabled}
                icon={<UploadFilesIcon className="w-4 h-4" />}
              >
                Upload Files
              </ActionButton>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              {error}
            </div>
          )}

          {/* File List */}
          <div className="space-y-0.5 font-mono">
            {unifiedFileList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                This directory is empty
              </div>
            ) : (
              unifiedFileList.map((item) => (
                <FileDisplay key={item.key} item={item} />
              ))
            )}
          </div>
          <input {...getInputProps()} />
        </div>
      )}
    </div>
  );
}
