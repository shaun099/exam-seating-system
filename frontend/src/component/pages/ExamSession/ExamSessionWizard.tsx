"use client"

import { useState } from "react"
import { SessionDetails } from "./SessionDetails"
import { DataImportInternal } from "./DataImportInternal"
import { DataImportKTU } from "./DataImportKTU"
import { DataImportAutonomous } from "./DataImportAutonomous"
import Preview from "./Preview"

interface ExamSessionWizardProps {
  onCancel: () => void;
  onNavigate: (page: string) => void; // This comes from App.tsx
}

export function ExamSessionWizard({ onCancel, onNavigate }: ExamSessionWizardProps) {
  const [step, setStep] = useState<"details" | "import" | "preview">("details")
  const [sessionConfig, setSessionConfig] = useState<any>(null)
  const [uploadPayload, setUploadPayload] = useState<any>(null)

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {step === "details" && (
        <SessionDetails
          config={{ rows: 6, columns: 5, maxCapacity: 30, interleaving: true }}
          onSubmit={(data) => { setSessionConfig(data); setStep("import"); }}
          onCancel={onCancel}
          onNavigate={onNavigate}
        />
      )}

      {step === "import" && (
        <>
          {sessionConfig?.examMode === "internal" ? (
            <DataImportInternal onUpload={(d) => { setUploadPayload(d); setStep("preview"); }} onBack={() => setStep("details")} />
          ) : sessionConfig?.batchType === "ktu" ? (
            <DataImportKTU onUpload={(d) => { setUploadPayload(d); setStep("preview"); }} onBack={() => setStep("details")} />
          ) : (
            <DataImportAutonomous onUpload={(d) => { setUploadPayload(d); setStep("preview"); }} onBack={() => setStep("details")} />
          )}
        </>
      )}

      {step === "preview" && (
        <Preview
          payload={uploadPayload}
          onBack={() => setStep("import")}
          onCancel={onCancel}
          // ✅ ROUTING LOGIC: This updates App.tsx's currentPage to "seating"
          onGenerate={() => onNavigate("seating")} 
        />
      )}
    </div>
  )
}