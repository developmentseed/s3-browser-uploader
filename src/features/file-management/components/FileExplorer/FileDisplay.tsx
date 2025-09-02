import React, { useState } from "react";
import Link from "next/link";
import {
  formatDate,
  formatFileSize,
  formatDateWithPreference,
} from "@/app/utils";
import { useFileSystem } from "@/features/file-management/contexts/FSContext";
import { usePreferences } from "@/features/preferences/contexts/PreferencesContext";
import type { FileItem } from "./FileExplorer";
import {
  FolderIcon,
  UploadIcon,
  ErrorIcon,
  FileIcon,
  CancelIcon,
  RetryIcon,
  TrashIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/shared/components";

interface FileItemProps {
  item: FileItem;
  onDelete?: () => void;
}

export const FileDisplay: React.FC<FileItemProps> = ({ item, onDelete }) => {
  return item.isDirectory ? (
    <DirectoryItem item={item} />
  ) : (
    <FileItem item={item} onDelete={onDelete} />
  );
};

const DirectoryItem = ({ item }: { item: FileItem }) => {
  return (
    <Link
      href={`/?prefix=${item.key}`}
      className="flex items-center gap-3 px-2 py-1.5 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-5">
        <FileDisplayIcon item={item} />
      </div>

      {/* Directory Info */}
      <div className="flex-1 min-w-0 flex items-center gap-4 text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1">
          {item.name}
        </div>
      </div>
    </Link>
  );
};

const FileItem = ({
  item,
  onDelete,
}: {
  item: FileItem;
  onDelete?: () => void;
}) => {
  const {
    uploads: { cancelUpload, retryUpload },
    downloadFile,
    getObjectMetadata,
  } = useFileSystem();
  const { preferences } = usePreferences();
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailedMetadata, setDetailedMetadata] = useState<{
    checksumCRC32?: string;
    checksumSHA1?: string;
    checksumSHA256?: string;
  } | null>(null);

  const handleDownload = async () => {
    try {
      const downloadUrl = await downloadFile(item.key);

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = item.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const toggleExpanded = async () => {
    if (!isExpanded && !detailedMetadata && !item.isUpload) {
      // Fetch detailed metadata when expanding for the first time
      try {
        const metadata = await getObjectMetadata(item.key);
        setDetailedMetadata({
          checksumCRC32: metadata.checksumCRC32,
          checksumSHA1: metadata.checksumSHA1,
          checksumSHA256: metadata.checksumSHA256,
        });
      } catch (error) {
        console.error("Error fetching detailed metadata:", error);
      }
    }
    setIsExpanded(!isExpanded);
  };

  // Get file extension and content type from S3 metadata only
  const getFileInfo = () => {
    const extension = item.name.split(".").pop()?.toLowerCase();

    // Only use S3 metadata - no filename inference
    return {
      extension,
      contentType: item.contentType || "Not specified",
    };
  };

  // Get checksums from S3 metadata - handle multiple checksums per file
  const getChecksums = () => {
    const checksums: Array<{
      algorithm: string;
      value: string;
      label: string;
    }> = [];

    // MD5 from ETag (always available if ETag exists)
    if (item.etag) {
      checksums.push({
        algorithm: "MD5",
        value: item.etag.replace(/"/g, ""),
        label: "MD5 (ETag)",
      });
    }

    // SHA256 if we have the actual value
    if (detailedMetadata?.checksumSHA256) {
      checksums.push({
        algorithm: "SHA256",
        value: detailedMetadata.checksumSHA256,
        label: "SHA256",
      });
    }

    // CRC32 if we have the actual value
    if (detailedMetadata?.checksumCRC32) {
      checksums.push({
        algorithm: "CRC32",
        value: detailedMetadata.checksumCRC32,
        label: "CRC32",
      });
    }

    // For uploads, show appropriate status
    if (item.isUpload) {
      if (item.uploadStatus === "completed") {
        checksums.push({
          algorithm: "MD5",
          value: "Calculated after upload",
          label: "MD5",
        });
        checksums.push({
          algorithm: "SHA256",
          value: "Calculated after upload",
          label: "SHA256",
        });
        checksums.push({
          algorithm: "CRC32",
          value: "Calculated after upload",
          label: "CRC32",
        });
      } else if (item.uploadStatus === "uploading") {
        checksums.push({
          algorithm: "MD5",
          value: "Calculating...",
          label: "MD5",
        });
        checksums.push({
          algorithm: "SHA256",
          value: "Calculating...",
          label: "SHA256",
        });
        checksums.push({
          algorithm: "CRC32",
          value: "Calculating...",
          label: "CRC32",
        });
      }
    }

    return checksums;
  };

  const { contentType } = getFileInfo();
  const checksums = getChecksums();

  return (
    <div
      className={`grid grid-cols-1 gap-0 px-2 py-1.5 rounded transition-colors ${
        item.isUpload && item.uploadStatus === "uploading"
          ? "bg-orange-50 dark:bg-orange-950/20"
          : item.isUpload && item.uploadStatus === "queued"
          ? "bg-blue-50 dark:bg-blue-950/20"
          : item.isUpload && item.uploadStatus === "error"
          ? "bg-red-50 dark:bg-red-950/20"
          : item.isUpload && item.uploadStatus === "cancelled"
          ? "bg-gray-50 dark:bg-gray-950/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-900"
      }`}
    >
      {/* Main file row */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-5">
          <FileDisplayIcon item={item} />
        </div>

        {/* File Info - Compact single line */}
        <div className="flex-1 min-w-0 flex items-center gap-4 text-sm">
          <div
            className="font-medium text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={toggleExpanded}
            title="Click to expand file details"
          >
            {item.name}
          </div>

          <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">
            {formatFileSize(item.size)}
          </div>

          <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">
            {item.isUpload && item.uploadStatus === "uploading" ? (
              <span className="text-orange-600 dark:text-orange-400">
                {Math.round(item.uploadProgress || 0)}%
              </span>
            ) : item.isUpload && item.uploadStatus === "queued" ? (
              <span className="text-blue-600 dark:text-blue-400">Queued</span>
            ) : item.isUpload && item.uploadStatus === "error" ? (
              <span
                className="text-red-600 dark:text-red-400"
                title={formatDate(item.lastModified).absolute}
              >
                Failed
              </span>
            ) : item.isUpload && item.uploadStatus === "cancelled" ? (
              <span className="text-gray-600 dark:text-gray-400">
                Cancelled
              </span>
            ) : (
              <span title={formatDate(item.lastModified).absolute}>
                {formatDateWithPreference(
                  item.lastModified,
                  preferences.dateFormat
                )}
              </span>
            )}
          </div>

          {/* Expand/collapse indicator */}
          <div className="flex-shrink-0">
            <button
              onClick={toggleExpanded}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar for uploading files */}
        {item.isUpload && item.uploadStatus === "uploading" && (
          <div className="flex-shrink-0 w-20">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-orange-600 dark:text-orange-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${item.uploadProgress || 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action buttons for uploads */}
        {item.isUpload && (
          <div className="flex-shrink-0 flex items-center gap-1">
            {(item.uploadStatus === "uploading" ||
              item.uploadStatus === "queued") && (
              <button
                onClick={() => cancelUpload(item.uploadId || item.key)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                title="Cancel upload"
              >
                <CancelIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            )}

            {(item.uploadStatus === "error" ||
              item.uploadStatus === "cancelled") && (
              <button
                onClick={() => retryUpload(item.uploadId || item.key)}
                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                title="Retry upload"
              >
                <RetryIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            )}
          </div>
        )}

        {/* Action buttons for non-upload files and completed uploads */}
        {(!item.isUpload || item.uploadStatus === "completed") && (
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
              title="Download file"
            >
              <DownloadIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:dark:text-green-400" />
            </button>

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                title="Delete file"
              >
                <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:dark:text-red-400" />
              </button>
            )}
          </div>
        )}

        {/* Status indicator for uploading files */}
        {item.isUpload && item.uploadStatus === "uploading" && (
          <div className="flex-shrink-0">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 dark:text-orange-400"></div>
          </div>
        )}
      </div>

      {/* Expanded file details */}
      {isExpanded && (
        <div className="ml-8 mt-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              {/* Basic file details */}
              <DetailRow label="Content Type" value={contentType} />
              <DetailRow label="Size" value={formatFileSize(item.size)} />
              <DetailRow
                label="Modified"
                value={formatDateWithPreference(
                  item.lastModified,
                  preferences.dateFormat
                )}
              />
              <DetailRow
                label="S3 Path"
                value={item.key}
                showCopyButton={true}
                onCopy={() => navigator.clipboard.writeText(item.key)}
              />

              {/* Checksums */}
              {checksums.map((checksum, index) => (
                <DetailRow
                  key={index}
                  label={checksum.label}
                  value={checksum.value}
                  showCopyButton={
                    !checksum.value.includes("Calculating") &&
                    !checksum.value.includes("Calculated") &&
                    !checksum.value.includes("Not available")
                  }
                  onCopy={() => navigator.clipboard.writeText(checksum.value)}
                />
              ))}

              {!checksums.length && (
                <div className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No checksums available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FileDisplayIcon = ({ item }: { item: FileItem }) => {
  if (item.isDirectory) {
    return <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  }

  if (item.isUpload) {
    switch (item.uploadStatus) {
      case "queued":
        return (
          <UploadIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        );
      case "uploading":
        return (
          <UploadIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        );
      case "error":
        return <ErrorIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case "cancelled":
        return (
          <CancelIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        );
      case "completed":
        return (
          <FileIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      default:
        return (
          <FileIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        );
    }
  }

  return <FileIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
};

// Helper component for detail rows
const DetailRow = ({
  label,
  value,
  showCopyButton = false,
  onCopy,
}: {
  label: string;
  value: string;
  showCopyButton?: boolean;
  onCopy?: () => void;
}) => (
  <div className="grid grid-cols-[auto_1fr] items-center gap-4">
    <span className="text-gray-600 dark:text-gray-400 flex-shrink-0 text-right">
      {label}:
    </span>
    <div className="flex items-center gap-2 min-w-0">
      <span className="font-mono text-gray-900 dark:text-gray-100 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all min-w-0 flex-1 text-right">
        {value}
      </span>
      {showCopyButton && onCopy && (
        <button
          onClick={onCopy}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          title={`Copy ${label.toLowerCase()} to clipboard`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      )}
    </div>
  </div>
);
