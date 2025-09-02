"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@/shared/components";

interface PrefixNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrefix: string;
  userPrefix: string;
}

export function PrefixNavigationModal({
  isOpen,
  onClose,
  currentPrefix,
  userPrefix,
}: PrefixNavigationModalProps) {
  const [inputPrefix, setInputPrefix] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputPrefix(currentPrefix);
      setError(null);
    } else {
      setInputPrefix("");
      setError(null);
    }
  }, [isOpen, currentPrefix]);

  const validatePrefix = (prefix: string): string | null => {
    if (!prefix.trim()) {
      return "Prefix cannot be empty";
    }

    // Remove leading/trailing slashes and normalize
    const normalizedPrefix = prefix.trim().replace(/^\/+|\/+$/g, "");
    
    if (normalizedPrefix && !normalizedPrefix.startsWith(userPrefix)) {
      return `Prefix must start with your user directory: ${userPrefix}`;
    }

    // Check for invalid characters
    if (normalizedPrefix.includes("..") || normalizedPrefix.includes("//")) {
      return "Invalid prefix format";
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validatePrefix(inputPrefix);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Normalize the prefix
    const normalizedPrefix = inputPrefix.trim().replace(/^\/+|\/+$/g, "");
    const finalPrefix = normalizedPrefix ? `${normalizedPrefix}/` : `${userPrefix}/`;

    // Navigate to the new prefix
    router.push(`/?prefix=${encodeURIComponent(finalPrefix)}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Navigate to Prefix
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label
              htmlFor="prefix-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Enter prefix path:
            </label>
            <input
              id="prefix-input"
              type="text"
              value={inputPrefix}
              onChange={(e) => {
                setInputPrefix(e.target.value);
                setError(null);
              }}
              placeholder={`e.g., ${userPrefix}documents/`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-mono"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Current prefix: <span className="font-mono">{currentPrefix}</span></p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Navigate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
