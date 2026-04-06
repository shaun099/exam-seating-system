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

  const uploadStudentsFiles = async (files: File[]) => {
    const apiBase = (
      import.meta.env.VITE_API_URL || "http://localhost:8000"
    ).replace(/\/$/, "");

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiBase}/api/v1/upload/students`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = `Failed to upload ${file.name}`;
        try {
          const data = await response.json();
          message = data?.message || message;
        } catch {
          // keep default message when response body is not JSON
        }
        throw new Error(message);
      }
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
