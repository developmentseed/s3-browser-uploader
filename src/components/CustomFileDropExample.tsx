"use client";

import React from "react";
import { useFileDrop } from "../hooks/useFileDrop";

interface CustomFileDropExampleProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxSize?: number;
}

export default function CustomFileDropExample({
  onFilesSelected,
  multiple = true,
  maxSize,
}: CustomFileDropExampleProps) {
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

  return (
    <div className="space-y-4">
      {/* Custom drop zone with different styling */}
      <div
        className={`
          relative p-6 rounded-lg border-2 transition-all duration-200
          ${isDragOver 
            ? "border-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg" 
            : "border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400"
          }
        `}
        {...dragHandlers}
      >
        {/* Custom drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-green-500/10 rounded-lg flex items-center justify-center">
            <div className="text-green-600 dark:text-green-400 text-xl font-bold">
              ✨ Release to upload! ✨
            </div>
          </div>
        )}

        {/* Custom content */}
        <div className={`text-center ${isDragOver ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}>
          <div className="text-4xl mb-2">📁</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Upload your files
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {multiple ? "Drop multiple files here" : "Drop a file here"}
          </p>
          {maxSize && (
            <p className="text-sm text-gray-500 mt-1">
              Max size: {(maxSize / (1024 * 1024)).toFixed(1)} MB
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

      {/* Custom button */}
      <button
        onClick={handleClick}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {multiple ? "Choose Files" : "Choose File"}
      </button>
    </div>
  );
}
