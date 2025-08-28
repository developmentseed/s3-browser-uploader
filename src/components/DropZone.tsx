"use client";

import { useDropzone } from "react-dropzone";

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  className?: string;
}

export default function DropZone({ onDrop, className = "" }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
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
  });

  return (
    <div className="space-y-4">
      {/* Main drop zone */}
      <div
        {...getRootProps()}
        className={`
          p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }
          ${className}
        `.trim()}
      >
        <input {...getInputProps()} />

        {isDragActive ? (
          <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
            Drop files here!
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
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
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Drop files here
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag and drop multiple files
            </p>
          </>
        )}
      </div>

      {/* Separate upload button */}
      <div className="text-center">
        <button
          onClick={open}
          className="px-6 py-3 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-medium transition-colors duration-200"
        >
          Choose Files
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Or click the button above to browse files
        </p>
      </div>
    </div>
  );
}
