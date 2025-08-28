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
      <DropZone onDrop={handleFilesSelected} disabled={!credentials} />
    </div>
  );
}
