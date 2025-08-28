"use client";

import { useCredentials } from "@/contexts/CredentialsContext";
import { DropZone } from "@/components";

export default function FileUploadSection() {
  const { credentials } = useCredentials();

  const handleFilesSelected = (files: File[]) => {
    // Early return if no credentials are available
    if (!credentials) {
      console.log("No credentials available, file upload disabled");
      return;
    }

    console.log("Selected files:", files);
    // Here you would typically handle the file upload to S3 using the credentials
    console.log("Using credentials:", credentials);
    // TODO: Implement S3 upload logic with credentials

    alert(
      `Selected ${files.length} file(s): ${files.map((f) => f.name).join(", ")}`
    );
  };

  return (
    <div className="space-y-6">
      {!credentials && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-amber-800 dark:text-amber-200 font-medium">
              Credentials Required
            </span>
          </div>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
            Please provide your credentials above to enable file upload
            functionality.
          </p>
        </div>
      )}
      <DropZone onDrop={handleFilesSelected} disabled={!credentials} />
    </div>
  );
}
