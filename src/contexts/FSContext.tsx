"use client";

import React, { createContext, useContext, useCallback } from "react";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { useAuth } from "./AuthContext";

interface FSObject {
  key: string; // Full S3 key (with prefix)
  lastModified: string;
  size: number;
  isDirectory: boolean;
}

interface FSContextType {
  listObjects: (prefix: string) => Promise<FSObject[]>;
  deleteObject: (key: string) => Promise<void>;
  createClient: () => S3Client | null;
}

const FSContext = createContext<FSContextType | undefined>(undefined);

export const useFS = () => {
  const context = useContext(FSContext);
  if (!context) {
    throw new Error("useFS must be used within an FSProvider");
  }
  return context;
};

interface FSProviderProps {
  children: React.ReactNode;
}

export const FSProvider: React.FC<FSProviderProps> = ({ children }) => {
  const { s3Credentials, s3Bucket } = useAuth();

  const createClient = useCallback((): S3Client | null => {
    if (!s3Credentials || !s3Bucket) return null;

    return new S3Client({
      region: s3Credentials.region,
      credentials: {
        accessKeyId: s3Credentials.accessKeyId,
        secretAccessKey: s3Credentials.secretAccessKey,
        sessionToken: s3Credentials.sessionToken,
      },
    });
  }, [s3Credentials, s3Bucket]);

  const listObjects = useCallback(
    async (prefix: string): Promise<FSObject[]> => {
      const client = createClient();
      if (!client) {
        throw new Error("File system client not available");
      }

      try {
        // List objects with the specified prefix
        const command = new ListObjectsV2Command({
          Bucket: s3Bucket!,
          Prefix: prefix.endsWith("/") ? prefix : `${prefix}/`,
          Delimiter: "/",
          MaxKeys: 1000,
        });

        const response = await client.send(command);

        // Process the response to create a clean list of objects
        const objects: FSObject[] = [];

        // Add directories (common prefixes)
        if (response.CommonPrefixes) {
          response.CommonPrefixes.forEach((commonPrefix) => {
            if (commonPrefix.Prefix) {
              objects.push({
                key: commonPrefix.Prefix,
                lastModified: new Date().toISOString(), // Directories don't have lastModified
                size: 0,
                isDirectory: true,
              });
            }
          });
        }

        // Add files
        if (response.Contents) {
          response.Contents.forEach((content) => {
            if (content.Key && content.Key !== prefix) {
              objects.push({
                key: content.Key,
                lastModified:
                  content.LastModified?.toISOString() ||
                  new Date().toISOString(),
                size: content.Size || 0,
                isDirectory: false,
              });
            }
          });
        }

        // Group by directories and files
        const directories = objects
          .filter((obj) => obj.isDirectory)
          .sort((a, b) => a.key.localeCompare(b.key));

        const files = objects
          .filter((obj) => !obj.isDirectory)
          .sort((a, b) => a.key.localeCompare(b.key));

        return [...directories, ...files];
      } catch (error) {
        console.error("Error listing file system objects:", error);
        throw new Error("Failed to fetch file system objects");
      }
    },
    [createClient, s3Bucket]
  );

  const deleteObject = useCallback(
    async (key: string): Promise<void> => {
      const client = createClient();
      if (!client) {
        throw new Error("File system client not available");
      }

      try {
        // Delete the object
        const command = new DeleteObjectCommand({
          Bucket: s3Bucket!,
          Key: key,
        });

        await client.send(command);
      } catch (error) {
        console.error("Error deleting file system object:", error);
        throw new Error("Failed to delete object");
      }
    },
    [createClient, s3Bucket]
  );

  const value: FSContextType = {
    listObjects,
    deleteObject,
    createClient,
  };

  return <FSContext.Provider value={value}>{children}</FSContext.Provider>;
};
