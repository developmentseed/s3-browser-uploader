"use client";

import { useState, useEffect } from "react";
import { useCredentials } from "@/contexts/CredentialsContext";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

interface S3Object {
  key: string;
  lastModified: string;
  size: number;
  isDirectory: boolean;
}

interface S3FileExplorerProps {
  className?: string;
}

export default function S3FileExplorer({ className = "" }: S3FileExplorerProps) {
  const { credentials, username, bucket } = useCredentials();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch S3 objects when credentials or path changes
  useEffect(() => {
    if (credentials && username && bucket) {
      fetchS3Objects();
    }
  }, [credentials, username, bucket, currentPath]);

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

      const prefix = currentPath ? `${username}/${currentPath}` : username;

      // List objects with the specified prefix
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${prefix}/`,
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
              lastModified: content.LastModified?.toISOString() || new Date().toISOString(),
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
    const relativePath = directoryKey.replace(`${username}/`, "");
    setCurrentPath(relativePath);
  };

  const navigateUp = () => {
    if (currentPath) {
      const parentPath = currentPath.split("/").slice(0, -1).join("/");
      setCurrentPath(parentPath);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisplayName = (key: string): string => {
    const parts = key.split("/");
    return parts[parts.length - 1] || key;
  };

  if (!credentials || !username || !bucket) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={() => setCurrentPath("")}
          className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          {username}
        </button>
        {currentPath && (
          <>
            <span>/</span>
            {currentPath.split("/").map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newPath = currentPath
                      .split("/")
                      .slice(0, index + 1)
                      .join("/");
                    setCurrentPath(newPath);
                  }}
                  className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  {segment}
                </button>
                {index < currentPath.split("/").length - 1 && <span>/</span>}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Back Button */}
      {currentPath && (
        <button
          onClick={navigateUp}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-800 dark:text-red-200 text-sm">{error}</div>
        </div>
      )}

      {/* File List */}
      {!loading && !error && (
        <div className="space-y-2">
          {objects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              This directory is empty
            </div>
          ) : (
            objects.map((obj) => (
              <div
                key={obj.key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  obj.isDirectory
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
                onClick={() => obj.isDirectory && navigateToDirectory(obj.key)}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {obj.isDirectory ? (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* File/Directory Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getDisplayName(obj.key)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {obj.isDirectory ? "Directory" : formatFileSize(obj.size)}
                  </div>
                </div>

                {/* Date */}
                <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(obj.lastModified)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
