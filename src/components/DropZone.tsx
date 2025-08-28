"use client";

import { useDropzone } from "react-dropzone";
import S3FileExplorer from "./S3FileExplorer";

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

export default function DropZone({
  onDrop,
  className = "",
  disabled = false,
}: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: disabled ? () => {} : onDrop,
    multiple: true,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "text/*": [".txt", ".md", ".json", ".csv"],
      "application/pdf": [".pdf"],
      "application/zip": [".zip"],
      "application/json": [".json"],
    },
    // Don't open file browser on click of the drop zone
    noClick: true,
    disabled: disabled,
  });

  return (
    <div className="space-y-4">
      {/* S3 File Explorer - shown when not disabled */}
      {!disabled && <S3FileExplorer />}

      {/* Main drop zone */}
      <div
        {...getRootProps()}
        className={`
          p-8 border-2 border-dashed rounded-lg text-center transition-all duration-200
          ${
            disabled
              ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60"
              : isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105 cursor-pointer"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          }
          ${className}
        `.trim()}
      >
        <input {...getInputProps()} />

        {isDragActive && !disabled ? (
          <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
            Drop files here!
          </div>
        ) : (
          <>
            <svg
              className={`mx-auto h-12 w-12 mb-4 ${
                disabled
                  ? "text-gray-300 dark:text-gray-600"
                  : "text-gray-400 dark:text-gray-500"
              }`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className={`text-lg font-medium mb-2 ${
                disabled
                  ? "text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {disabled ? "Upload Disabled" : "Drop files here"}
            </div>
            <p
              className={`text-sm ${
                disabled
                  ? "text-gray-400 dark:text-gray-500"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {disabled
                ? "Please provide credentials to enable file upload"
                : "Drag and drop multiple files"}
            </p>
          </>
        )}
      </div>

      {/* Separate upload button */}
      <div className="text-center">
        <button
          onClick={open}
          disabled={disabled}
          className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
            disabled
              ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black"
          }`}
        >
          Choose Files
        </button>
        <p
          className={`text-sm mt-2 ${
            disabled
              ? "text-gray-400 dark:text-gray-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {disabled
            ? "Upload is disabled until credentials are provided"
            : "Or click the button above to browse files"}
        </p>
      </div>
    </div>
  );
}
