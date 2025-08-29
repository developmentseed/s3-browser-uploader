import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDate, formatFileSize } from "@/app/utils";
import type { FileItem } from "./FileExplorer";
import {
  FolderIcon,
  UploadIcon,
  ErrorIcon,
  FileIcon,
} from "../../app/graphics";

interface FileItemProps {
  item: FileItem;
  username: string;
}

export const FileDisplay: React.FC<FileItemProps> = ({ item }) => {
  return item.isDirectory ? (
    <DirectoryItem item={item} />
  ) : (
    <FileItem item={item} />
  );
};

const DirectoryItem = ({ item }: { item: FileItem }) => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user")!;

  return (
    <Link
      href={`/?user=${user}&prefix=${item.key}`}
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

const FileItem = ({ item }: { item: FileItem }) => (
  <div
    className={`flex items-center gap-3 px-2 py-1.5 rounded transition-colors ${
      item.isUpload && item.uploadStatus === "uploading"
        ? "bg-orange-50 dark:bg-orange-950/20"
        : item.isUpload && item.uploadStatus === "error"
        ? "bg-red-50 dark:bg-red-950/20"
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

const FileDisplayIcon = ({ item }: { item: FileItem }) => {
  if (item.isDirectory) {
    return <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  }

  if (item.isUpload && item.uploadStatus === "uploading") {
    return (
      <UploadIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    );
  }

  if (item.isUpload && item.uploadStatus === "error") {
    return <ErrorIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
  }

  return <FileIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
};
