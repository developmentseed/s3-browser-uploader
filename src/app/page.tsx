"use client";

import { AuthProvider } from "@/features/auth";
import { PreferencesProvider } from "@/features/preferences";
import { SessionProvider } from "next-auth/react";
import { HomeContent } from "@/features/home";
import { FileSystemProvider } from "@/features/file-management";
import { Suspense } from "react";

export default function Home() {
  return (
    <SessionProvider>
      <AuthProvider>
        <PreferencesProvider>
          <FileSystemProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <HomeContent />
            </Suspense>
          </FileSystemProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
