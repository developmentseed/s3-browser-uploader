"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useFileSystem } from "@/features/file-management/contexts/FSContext";
import { ActionButton } from "@/shared/components/ActionButton";
import { FileDisplay } from "./FileDisplay";
import { PreferencesModal } from "@/features/preferences/components/PreferencesModal";
import Link from "next/link";
import {
  UploadFilesIcon,
  RefreshIcon,
  CogIcon,
  LoadingIcon,
} from "@/shared/components";

// Import FSObject type from FSContext
import type { FSObject } from "@/features/file-management/contexts/FSContext";

export interface FileItem {
  key: string;
  name: string;
  lastModified: string;
  size: number;
  isDirectory: boolean;
  isUpload: boolean;
  uploadStatus?: "queued" | "uploading" | "completed" | "error" | "cancelled";
  uploadProgress?: number;
  uploadError?: string;
  uploadId?: string;
  contentType?: string;
  etag?: string;
  checksumAlgorithm?: string;
}

interface FileExplorerProps {
  className?: string;
  disabled?: boolean;
  prefix: string;
}

export function FileExplorer({
  className = "",
  disabled = false,
  prefix,
}: FileExplorerProps) {
  const {
    uploads: { uploadFiles, progress: uploadProgress },
  } = useFileSystem();
  const { listObjects, deleteObject } = useFileSystem();

  const [objects, setObjects] = useState<FSObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Function to remove an item from the local state
  const removeItemFromState = (keyToRemove: string) => {
    setObjects((prevObjects) =>
      prevObjects.filter((obj) => obj.key !== keyToRemove)
    );
  };

  // Function to handle file deletion
  const handleDeleteFile = async (item: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      console.log("Attempting to delete file:", item);
      console.log("Available objects:", objects);

      // Find the corresponding FSObject to get the key
      const fsObject = objects.find((obj) => obj.key === item.key);
      if (!fsObject) {
        console.error("File not found in file system:", item.key);
        throw new Error("File not found in file system");
      }

      console.log("Found FSObject:", fsObject);
      console.log("Deleting with key:", fsObject.key);

      await deleteObject(fsObject.key);

      console.log("Delete successful, removing from local state");
      // Remove the item from local state
      removeItemFromState(item.key);
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

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

  // Fetch file system objects when credentials or prefix changes
  useEffect(() => {
    fetchFileSystemObjects();
  }, [prefix, listObjects]);

  // Refresh file list when ALL uploads complete
  useEffect(() => {
    const hasActiveUploads = uploadProgress.some(
      (up) => up.status === "uploading" || up.status === "queued"
    );
    const hasCompletedUploads = uploadProgress.some(
      (up) => up.status === "completed"
    );

    // Only refresh when there are no active uploads AND there are completed uploads
    if (!hasActiveUploads && hasCompletedUploads) {
      // Wait a bit for the file system to be consistent, then refresh
      const timer = setTimeout(() => {
        fetchFileSystemObjects();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress, listObjects]);

  const fetchFileSystemObjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedObjects = await listObjects(prefix);
      setObjects(fetchedObjects);
    } catch (err) {
      setError("Failed to fetch file system objects");
      console.error("Error fetching file system objects:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (key: string): string => {
    return key.replace(/\/$/, "").split("/").pop()!;
  };

  // Create unified file list combining file system objects and uploads
  const unifiedFileList: FileItem[] = Object.values(
    Object.fromEntries([
      // File System Objects
      ...objects.map((obj): [string, FileItem] => [
        obj.key,
        {
          key: obj.key,
          name: getDisplayName(obj.key),
          lastModified: obj.lastModified,
          size: obj.size,
          isDirectory: obj.isDirectory,
          isUpload: false,
          contentType: obj.contentType,
          etag: obj.etag,
          checksumAlgorithm: obj.checksumAlgorithm,
        },
      ]),
      // Uploads in Prefix (possibly overwriting existing file system objects)
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

  return (
    <div className="min-h-screen space-y-4" {...getRootProps()}>
      {/* File System Explorer - shown when not disabled */}
      {!disabled && (
        <div className="space-y-4">
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
          <div className="mx-auto max-w-6xl w-full flex items-center justify-between py-2 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
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
                onClick={fetchFileSystemObjects}
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

              <ActionButton
                onClick={() => setIsPreferencesOpen(true)}
                icon={<CogIcon className="w-4 h-4" />}
              />
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
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingIcon />
              </div>
            ) : unifiedFileList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No files found at this prefix
              </div>
            ) : (
              unifiedFileList.map((item) => (
                <FileDisplay
                  key={item.key}
                  item={item}
                  onDelete={
                    !item.isDirectory ? () => handleDeleteFile(item) : undefined
                  }
                />
              ))
            )}
          </div>
          <input {...getInputProps()} />
        </div>
      )}

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
}
