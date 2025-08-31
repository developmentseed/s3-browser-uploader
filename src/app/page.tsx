"use client";

import { AuthProvider } from "@/features/auth";
import { PreferencesProvider } from "@/features/preferences";
import { SessionProvider } from "next-auth/react";
import { HomeContent } from "@/features/home";
import { FileSystemProvider } from "@/features/file-management";

export default function Home() {
  return (
    <SessionProvider>
      <AuthProvider>
        <PreferencesProvider>
          <FileSystemProvider>
            <HomeContent />
          </FileSystemProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
