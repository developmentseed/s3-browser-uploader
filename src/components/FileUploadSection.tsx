"use client";

import { useState, useCallback, useEffect } from "react";
import { useCredentials } from "@/contexts/CredentialsContext";
import { FileExplorer } from "@/components";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";

interface UploadProgress {
  file: File;
  key: string;
  uploadedBytes: number;
  totalBytes: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface FileUploadSectionProps {
  prefix: string;
  onPrefixChange: (prefix: string) => void;
}

export default function FileUploadSection({
  prefix,
  onPrefixChange,
}: FileUploadSectionProps) {
  const { credentials, username, bucket } = useCredentials();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const handleFilesSelected = useCallback(
    async (files: File[], filePrefix: string) => {
      // Early return if no credentials are available
      if (!credentials || !username || !bucket) {
        console.log("No credentials available, file upload disabled");
        return;
      }

      console.log("Selected files:", files, "for prefix:", filePrefix);
      onPrefixChange(filePrefix);

      // Create S3 client with user credentials
      const s3Client = new S3Client({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      // Initialize upload progress for each file
      const initialProgress: UploadProgress[] = files.map((file) => ({
        file,
        key: `${username}/${prefix}${file.name}`,
        uploadedBytes: 0,
        totalBytes: file.size,
        status: "uploading",
      }));

      setUploadProgress((prev) => [...prev, ...initialProgress]);

      // Upload each file
      files.forEach(async (file, index) => {
        try {
          const key = `${username}/${prefix}${file.name}`;

          const upload = new Upload({
            client: s3Client,
            params: {
              Bucket: bucket,
              Key: key,
              Body: file,
              ContentType: file.type || "application/octet-stream",
              ChecksumAlgorithm: "CRC32",
            },
            queueSize: 8,
            partSize: 1024 * 1024 * 5, // 5MB chunks
            leavePartsOnError: false,
          });

          // Track upload progress
          upload.on("httpUploadProgress", (progress) => {
            setUploadProgress((prev) =>
              prev.map((up) =>
                up.file === file
                  ? { ...up, uploadedBytes: progress.loaded || 0 }
                  : up
              )
            );
          });

          // Start the upload
          await upload.done();

          // Mark as completed
          setUploadProgress((prev) =>
            prev.map((up) =>
              up.file === file ? { ...up, status: "completed" as const } : up
            )
          );

          console.log(`File ${file.name} uploaded successfully to ${key}`);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);

          // Handle specific checksum errors
          let errorMessage = "Unknown error";
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          // Mark as error
          setUploadProgress((prev) =>
            prev.map((up) =>
              up.file === file
                ? {
                    ...up,
                    status: "error" as const,
                    error: errorMessage,
                  }
                : up
            )
          );
        }
      });
    },
    [credentials, username, bucket]
  );

  // Clean up completed uploads after a delay
  const cleanupCompletedUploads = useCallback(() => {
    setTimeout(() => {
      setUploadProgress((prev) =>
        prev.filter((up) => up.status !== "completed")
      );
    }, 5000); // Remove completed uploads after 5 seconds
  }, []);

  // Clean up completed uploads when they complete
  useEffect(() => {
    const completedCount = uploadProgress.filter(
      (up) => up.status === "completed"
    ).length;
    if (completedCount > 0) {
      cleanupCompletedUploads();
    }
  }, [uploadProgress, cleanupCompletedUploads]);

  return (
    <FileExplorer
      onFileUpload={(files) => handleFilesSelected(files, prefix)}
      disabled={!credentials}
      uploadProgress={uploadProgress}
      prefix={prefix}
      onPrefixChange={onPrefixChange}
    />
  );
}
