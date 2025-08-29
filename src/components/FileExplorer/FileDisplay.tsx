import React from "react";
import Link from "next/link";
import {
  formatDate,
  formatFileSize,
  formatDateWithPreference,
} from "@/app/utils";
import { useUpload } from "@/contexts";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { FileItem } from "./FileExplorer";
import {
  FolderIcon,
  UploadIcon,
  ErrorIcon,
  FileIcon,
  CancelIcon,
  RetryIcon,
  TrashIcon,
} from "@/graphics";

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
  const { cancelUpload, retryUpload } = useUpload();
  const { preferences } = usePreferences();

  return (
    <div
      className={`flex items-center gap-3 px-2 py-1.5 rounded transition-colors ${
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
      {/* Icon */}
      <div className="flex-shrink-0 w-5">
        <FileDisplayIcon item={item} />
      </div>

      {/* File Info - Compact single line */}
      <div className="flex-1 min-w-0 flex items-center gap-4 text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1">
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
            <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
          ) : (
            <span title={formatDate(item.lastModified).absolute}>
              {formatDateWithPreference(
                item.lastModified,
                preferences.dateFormat
              )}
            </span>
          )}
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

      {/* Delete button for non-upload files */}
      {!item.isUpload && onDelete && (
        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            title="Delete file"
          >
            <TrashIcon className="w-4 h-4 hover:text-red-600 hover:dark:text-red-400" />
          </button>
        </div>
      )}

      {/* Status indicator for uploading files */}
      {item.isUpload && item.uploadStatus === "uploading" && (
        <div className="flex-shrink-0">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 dark:text-orange-400"></div>
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
