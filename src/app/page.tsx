"use client";

import { FileDropZone, CredentialsForm } from "@/components";
import {
  CredentialsProvider,
  useCredentials,
} from "@/contexts/CredentialsContext";

function FileUploadSection() {
  const { credentials } = useCredentials();

  const handleFilesSelected = (files: File[]) => {
    console.log("Selected files:", files);
    // Here you would typically handle the file upload to S3 using the credentials
    if (credentials) {
      console.log("Using credentials:", credentials);
      // TODO: Implement S3 upload logic with credentials
    }
    alert(
      `Selected ${files.length} file(s): ${files.map((f) => f.name).join(", ")}`
    );
  };

  return (
    <FileDropZone
      onFilesSelected={handleFilesSelected}
      multiple={true}
      className="mb-8"
    />
  );
}

export default function Home() {
  return (
    <CredentialsProvider>
      <div className="font-mono grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
          <div className="w-full">
            <h2 className="text-2xl font-bold text-center mb-6">
              File Upload Demo
            </h2>

            <CredentialsForm />
            <FileUploadSection />
          </div>
        </main>
      </div>
    </CredentialsProvider>
  );
}
