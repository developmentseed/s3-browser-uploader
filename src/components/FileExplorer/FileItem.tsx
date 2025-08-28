import React from "react";
import { FileIcon } from "./FileIcon";

// Import the FileItem interface from S3FileExplorer
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
}

interface FileItemProps {
  item: FileItem;
  onNavigateToDirectory: (key: string) => void;
  formatFileSize: (size: number) => string;
  formatDate: (dateString: string) => { relative: string; absolute: string };
}

export const FileItem: React.FC<FileItemProps> = ({
  item,
  onNavigateToDirectory,
  formatFileSize,
  formatDate,
}) => {
  return (
    <div
      key={item.key}
      className={`flex items-center gap-3 px-2 py-1.5 rounded transition-colors ${
        item.isDirectory
          ? "hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer"
          : item.isUpload && item.uploadStatus === "uploading"
          ? "bg-orange-50 dark:bg-orange-950/20"
          : item.isUpload && item.uploadStatus === "error"
          ? "bg-red-50 dark:bg-red-950/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-900"
      }`}
      onClick={() => item.isDirectory && onNavigateToDirectory(item.key)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-5">
        <FileIcon item={item} />
      </div>

      {/* File/Directory Info - Compact single line */}
      <div className="flex-1 min-w-0 flex items-center gap-4 text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1">
          {item.name}
        </div>

        <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">
          {item.isDirectory ? "Directory" : formatFileSize(item.size)}
        </div>

        <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">
          {item.isUpload && item.uploadStatus === "uploading" ? (
            <span className="text-orange-600 dark:text-orange-400">
              {Math.round(item.uploadProgress || 0)}%
            </span>
          ) : item.isUpload && item.uploadStatus === "error" ? (
            <span className="text-red-600 dark:text-red-400">Failed</span>
          ) : (
            formatDate(item.lastModified).relative
          )}
        </div>
      </div>

      {/* Progress Bar for uploading files */}
      {item.isUpload && item.uploadStatus === "uploading" && (
        <div className="flex-shrink-0 w-20">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-orange-600 dark:bg-orange-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${item.uploadProgress || 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status indicator for uploading files */}
      {item.isUpload && item.uploadStatus === "uploading" && (
        <div className="flex-shrink-0">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 dark:border-orange-400"></div>
        </div>
      )}
    </div>
  );
};
