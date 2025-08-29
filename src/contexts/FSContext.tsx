"use client";

import React, { createContext, useContext, useCallback } from "react";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { useCredentials } from "./CredentialsContext";

interface FSObject {
  key: string;
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
  const { credentials, bucket } = useCredentials();

  const createClient = useCallback((): S3Client | null => {
    if (!credentials || !bucket) return null;

    return new S3Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });
  }, [credentials, bucket]);

  const listObjects = useCallback(
    async (prefix: string): Promise<FSObject[]> => {
      const client = createClient();
      if (!client) {
        throw new Error("File system client not available");
      }

      try {
        // List objects with the specified prefix
        const command = new ListObjectsV2Command({
          Bucket: bucket!,
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
              // Remove username from the key for display
              const displayKey = content.Key.replace(`${prefix}/`, "");
              objects.push({
                key: displayKey,
                lastModified:
                  content.LastModified?.toISOString() || new Date().toISOString(),
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
    [createClient, bucket]
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
          Bucket: bucket!,
          Key: key,
        });

        await client.send(command);
      } catch (error) {
        console.error("Error deleting file system object:", error);
        throw new Error("Failed to delete object");
      }
    },
    [createClient, bucket]
  );

  const value: FSContextType = {
    listObjects,
    deleteObject,
    createClient,
  };

  return <FSContext.Provider value={value}>{children}</FSContext.Provider>;
};
