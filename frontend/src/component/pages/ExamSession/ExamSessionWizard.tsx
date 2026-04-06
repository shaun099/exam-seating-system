"use client";

import { useState } from "react";
import { SessionDetails } from "./SessionDetails";
import { DataImportInternal } from "./DataImportInternal";
import { DataImportKTU } from "./DataImportKTU";
import { DataImportAutonomous } from "./DataImportAutonomous";
import Preview from "./Preview";

interface ExamSessionWizardProps {
  onCancel: () => void;
  onNavigate: (page: string) => void; // This comes from App.tsx
}

export function ExamSessionWizard({
  onCancel,
  onNavigate,
}: ExamSessionWizardProps) {
  const [step, setStep] = useState<"details" | "import" | "preview">("details");
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const [uploadPayload, setUploadPayload] = useState<any>(null);

  // const uploadStudentsFiles = async (files: File[]) => {
  //   const apiBase = (
  //     import.meta.env.VITE_API_URL || "http://localhost:8000"
  //   ).replace(/\/$/, "");

  //   for (const file of files) {
  //     const formData = new FormData();
  //     formData.append("file", file);

  //     const response = await fetch(`${apiBase}/api/v1/upload/students`, {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       let message = `Failed to upload ${file.name}`;
  //       try {
  //         const data = await response.json();
  //         message = data?.message || message;
  //       } catch {
  //         // keep default message when response body is not JSON
  //       }
  //       throw new Error(message);
  //     }
  //   }
  // };

  const uploadStudentsFiles = async (files: File[]) => {
    const apiBase = (
      import.meta.env.VITE_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");

    const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB per chunk — well under 30s

    for (const file of files) {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = crypto.randomUUID();
      let finalResult = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("upload_id", uploadId);
        formData.append("chunk_index", String(i));
        formData.append("total_chunks", String(totalChunks));
        formData.append("filename", file.name); // so backend knows the extension

        const response = await fetch(
          `${apiBase}/api/v1/upload/students/chunk`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          let message = `Failed to upload ${file.name}`;
          try {
            const data = await response.json();
            message = data?.message || message;
          } catch {
            // Keep default message when response body is not JSON.
          }
          throw new Error(message);
        }

        const data = await response.json();

        // Last chunk triggers processing — capture result
        if (data.status === "complete") {
          finalResult = data;
        }
      }

      return finalResult;
    }
  };
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {step === "details" && (
        <SessionDetails
          config={{ rows: 6, columns: 5, maxCapacity: 30, interleaving: true }}
          onSubmit={(data) => {
            setSessionConfig(data);
            setStep("import");
          }}
          onCancel={onCancel}
          onNavigate={onNavigate}
        />
      )}

      {step === "import" && (
        <>
          {sessionConfig?.examMode === "internal" ? (
            <DataImportInternal
              onUpload={(d) => {
                setUploadPayload(d);
                setStep("preview");
              }}
              onBack={() => setStep("details")}
            />
          ) : sessionConfig?.batchType === "ktu" ? (
            <DataImportKTU
              onUpload={(d) => {
                setUploadPayload(d);
                setStep("preview");
              }}
              onBack={() => setStep("details")}
            />
          ) : (
            <DataImportAutonomous
              onUpload={(d) => {
                setUploadPayload(d);
                setStep("preview");
              }}
              onBack={() => setStep("details")}
            />
          )}
        </>
      )}

      {step === "preview" && (
        <Preview
          payload={uploadPayload}
          onBack={() => setStep("import")}
          onCancel={onCancel}
          onGenerate={async (files) => {
            try {
              await uploadStudentsFiles(files);
              onNavigate("seating");
            } catch (error: any) {
              alert(error?.message || "Student upload failed");
            }
          }}
        />
      )}
    </div>
  );
}
