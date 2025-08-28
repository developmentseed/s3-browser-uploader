"use client";

import { CredentialsForm, FileUploadSection } from "@/components";
import { CredentialsProvider } from "@/contexts/CredentialsContext";

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
