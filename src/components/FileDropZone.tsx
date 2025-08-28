"use client";

import React from "react";
import { useFileDrop } from "../hooks/useFileDrop";

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxSize?: number; // in bytes
  className?: string;
}

export default function FileDropZone({
  onFilesSelected,
  multiple = true,
  maxSize,
  className = "",
}: FileDropZoneProps) {
  const {
    isDragOver,
    fileInputRef,
    dragHandlers,
    handleFileInputChange,
    handleClick,
  } = useFileDrop({
    onFilesSelected,
    multiple,
    maxSize,
  });

  const boxClasses = isDragOver
    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105"
    : "border-gray-300 dark:border-gray-600";

  return (
    <div>
      <div
        className={`
          w-full ${className}
          relative w-full min-h-[200px] rounded-xs border-2 border-dashed
          transition-all duration-200 ease-in-out
          flex flex-col items-center justify-center p-8
          ${boxClasses}
        `}
        {...dragHandlers}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-xs flex items-center justify-center">
            <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">
              Drop files here
            </div>
          </div>
        )}

        {/* Default content */}
        <div
          className={`text-center ${
            isDragOver ? "opacity-0" : "opacity-100"
          } transition-opacity duration-200`}
        >
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
            {multiple ? "Drag and drop multiple files" : "Drag and drop a file"}
          </p>
          {maxSize && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Max file size: {(maxSize / (1024 * 1024)).toFixed(1)} MB
            </p>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      <div className="text-sm text-gray-400 dark:text-gray-500 mt-4">
        <button onClick={handleClick} className="cursor-pointer">
          Click to select file to upload
        </button>
      </div>
    </div>
  );
}
