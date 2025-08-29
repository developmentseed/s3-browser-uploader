"use client";

import { useUpload } from "@/contexts";
import {
  CancelIcon,
  CheckIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@/graphics";
import { formatFileSize } from "@/app/utils";
import { useState, useRef, useCallback, useEffect } from "react";

export default function UploadLogDrawer() {
  const {
    uploadProgress,
    clearCompleted,
    clearErrors,
    removeCancelled,
    clearAllUploads,
    cancelUpload,
    retryUpload,
  } = useUpload();

  const [isExpanded, setIsExpanded] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(25); // Default 25vh (25% of viewport height)
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const rect = resizeRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate height as percentage of viewport height
      const newHeightPercent =
        ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
      const minHeight = 15; // 15vh (15% of viewport height)
      const maxHeight = 80; // 80vh (80% of viewport height)

      setDrawerHeight(
        Math.max(minHeight, Math.min(maxHeight, newHeightPercent))
      );
    },
    [isResizing]
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      return () => {
        document.removeEventListener("mousemove", handleResize);
        document.removeEventListener("mouseup", stopResize);
      };
    }
  }, [isResizing, handleResize, stopResize]);

  if (uploadProgress.length === 0) {
    return null;
  }

  const completedCount = uploadProgress.filter(
    (up) => up.status === "completed"
  ).length;
  const errorCount = uploadProgress.filter(
    (up) => up.status === "error"
  ).length;
  const uploadingCount = uploadProgress.filter(
    (up) => up.status === "uploading"
  ).length;
  const queuedCount = uploadProgress.filter(
    (up) => up.status === "queued"
  ).length;
  const cancelledCount = uploadProgress.filter(
    (up) => up.status === "cancelled"
  ).length;

  const formatProgress = (uploaded: number, total: number) => {
    if (total === 0) return "0%";
    return Math.round((uploaded / total) * 100) + "%";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Collapsed State */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          {uploadingCount > 0 && (
            <div className="flex items-center gap-2 text-black dark:text-black">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black dark:border-black"></div>
              <span>{uploadingCount} uploading</span>
            </div>
          )}

          {queuedCount > 0 && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span>{queuedCount} queued</span>
            </div>
          )}

          {completedCount > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckIcon className="w-3 h-3" />
              <span>{completedCount} completed</span>
            </div>
          )}

          {errorCount > 0 && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XIcon className="w-3 h-3" />
              <span>{errorCount} failed</span>
            </div>
          )}

          {cancelledCount > 0 && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span>{cancelledCount} cancelled</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronUpIcon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={clearAllUploads}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Clear all uploads"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded State */}
      {isExpanded && (
        <>
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            className="h-1 bg-gray-200 dark:bg-gray-600 cursor-ns-resize hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            onMouseDown={startResize}
            title="Drag to resize drawer height"
          >
            <div className="flex justify-center">
              <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
          </div>

          {/* Drawer Content */}
          {/* Height is now relative to viewport height (vh) for better responsiveness */}
          <div
            className="border-t border-gray-200 dark:border-gray-700 overflow-y-auto"
            style={{ height: `${drawerHeight}vh` }}
          >
            <div className="p-3">
              {/* Upload Log */}
              <div className="space-y-2">
                {uploadProgress.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {upload.status === "queued" && (
                        <div className="w-4 h-4 text-blue-600 dark:text-blue-400">
                          <span className="text-xs">⏳</span>
                        </div>
                      )}
                      {upload.status === "uploading" && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black dark:border-black"></div>
                      )}
                      {upload.status === "completed" && (
                        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                      {upload.status === "error" && (
                        <XIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      {upload.status === "cancelled" && (
                        <CancelIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>

                    {/* File Info - Horizontal Layout */}
                    <div className="font-mono flex-1 min-w-0 flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {upload.file.name} → {upload.key}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {formatFileSize(upload.totalBytes)}
                      </div>
                    </div>

                    {/* Progress or Status - Compact */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {upload.status === "queued" && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Queued
                        </span>
                      )}

                      {upload.status === "uploading" && (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div
                              className="bg-black dark:bg-black h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  (upload.uploadedBytes / upload.totalBytes) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                            {formatProgress(
                              upload.uploadedBytes,
                              upload.totalBytes
                            )}
                          </span>
                        </div>
                      )}

                      {upload.status === "completed" && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Complete
                        </span>
                      )}

                      {upload.status === "error" && (
                        <div className="max-w-32">
                          <div
                            className="text-xs text-red-600 dark:text-red-400 truncate"
                            title={upload.error}
                          >
                            {upload.error}
                          </div>
                        </div>
                      )}

                      {upload.status === "cancelled" && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          Cancelled
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(upload.status === "uploading" ||
                        upload.status === "queued") && (
                        <button
                          onClick={() => cancelUpload(upload.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Cancel upload"
                        >
                          <CancelIcon className="w-3 h-3" />
                        </button>
                      )}

                      {(upload.status === "error" ||
                        upload.status === "cancelled") && (
                        <button
                          onClick={() => retryUpload(upload.id)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Retry upload"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Actions - Compact */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total: {uploadProgress.length} files
                </div>

                <div className="flex items-center gap-2">
                  {completedCount > 0 && (
                    <button
                      onClick={clearCompleted}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Clear Completed
                    </button>
                  )}

                  {errorCount > 0 && (
                    <button
                      onClick={clearErrors}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Clear Errors
                    </button>
                  )}

                  {cancelledCount > 0 && (
                    <button
                      onClick={removeCancelled}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Clear Cancelled
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
