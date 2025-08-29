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
}

export default function FileUploadSection({ prefix }: FileUploadSectionProps) {
  const { credentials, bucket } = useCredentials();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      // Early return if no credentials are available
      if (!credentials || !bucket) {
        console.log("No credentials available, file upload disabled");
        return;
      }

      // Create S3 client with user credentials
      const s3Client = new S3Client({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });

      // Normalize prefix to ensure it ends with slash
      const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

      // Initialize upload progress for each file
      const initialProgress: UploadProgress[] = files.map((file) => ({
        file,
        key: `${normalizedPrefix}${file.name}`,
        uploadedBytes: 0,
        totalBytes: file.size,
        status: "uploading",
      }));

      setUploadProgress((prev) => [...prev, ...initialProgress]);

      // Upload each file
      const promises = files.map(async (file) => {
        try {
          const key = `${normalizedPrefix}${file.name}`;

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

      // NOTE: Consider uploading more than one file at a time...
      for (const promise of promises) {
        await promise;
      }
    },
    [credentials, bucket, prefix]
  );

  return (
    <FileExplorer
      onFileUpload={(files) => handleFilesSelected(files)}
      disabled={!credentials}
      uploadProgress={uploadProgress}
      prefix={prefix}
    />
  );
}
