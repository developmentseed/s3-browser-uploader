"use client";

import { usePreferences } from "@/contexts/PreferencesContext";
import { XIcon } from "@/graphics";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();

  const handleReset = () => {
    resetPreferences();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preferences
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Upload Queue Size */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Upload Queue Size
            </label>
            <div className="space-y-2">
              <input
                type="number"
                min="1"
                value={preferences.uploadQueueSize}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1) {
                    updatePreferences({
                      ...preferences,
                      uploadQueueSize: value,
                    });
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                placeholder="Enter queue size"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Number of file chunks that can be uploaded simultaneously
              </p>
            </div>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Date Display Format
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "relative",
                  label: "Relative",
                  example: "2 hours ago",
                },
                {
                  value: "absolute",
                  label: "Absolute",
                  example: "Dec 15, 2023, 2:30 PM",
                },
                {
                  value: "iso8601",
                  label: "ISO8601",
                  example: "2023-12-15T14:30:00.000Z",
                },
              ].map(({ value, label, example }) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name="dateFormat"
                    value={value}
                    checked={preferences.dateFormat === value}
                    onChange={(e) =>
                      updatePreferences({
                        ...preferences,
                        dateFormat: e.target.value as
                          | "relative"
                          | "absolute"
                          | "iso8601",
                      })
                    }
                    className="mr-2 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {label} (e.g., <span className="font-mono">{example}</span>)
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
