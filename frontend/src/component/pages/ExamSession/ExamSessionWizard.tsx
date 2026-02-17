"use client"

import { useState } from "react"
import { SessionDetails } from "./SessionDetails"
import { DataImportKTU } from "./DataImportKTU"
import { DataImportAutonomous } from "./DataImportAutonomous"
import { DataPreview } from "./Preview";

export type WizardStep = "details" | "import" | "preview"

export interface StudentRow {
  regNo: string
  name: string
  subject: string
  slot: string
  valid: boolean
  error?: string 
}

// Updated props interface to include onNavigate
export function ExamSessionWizard({ 
  onCancel, 
  onNavigate 
}: { 
  onCancel: () => void;
  onNavigate: (page: string) => void; 
}) {
  const [step, setStep] = useState<WizardStep>("details")
  const [batchType, setBatchType] = useState<string>("")
  const [examMode, setExamMode] = useState<string>("")
  const [uploadedData, setUploadedData] = useState<StudentRow[]>([])

  const handleDetailsSubmit = (data: {
    batchType: string
    examMode: string
  }) => {
    setBatchType(data.batchType)
    setExamMode(data.examMode)
    setStep("import")
  }

  const handleUploadComplete = (data: StudentRow[]) => {
    setUploadedData(data)
    setStep("preview")
  }

  const handleGenerate = () => {
    console.log("Generating seating plan...")
    console.log({ batchType, examMode, uploadedData })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {step === "details" && (
        <SessionDetails
          config={{
            rows: 6,
            columns: 5,
            maxCapacity: 30,
            interleaving: true,
          }}
          onSubmit={handleDetailsSubmit}
          onCancel={onCancel}
          onNavigate={onNavigate} // ✅ Pass the prop here
        />
      )}

      {step === "import" && batchType === "ktu" && (
        <DataImportKTU
          onUpload={handleUploadComplete}
          onBack={() => setStep("details")}
        />
      )}

      {step === "import" && batchType === "autonomous" && (
        <DataImportAutonomous
          onUpload={handleUploadComplete}
          onBack={() => setStep("details")}
        />
      )}
      {step === "preview" && (
      <DataPreview
        data={uploadedData} // Changed from 'data' to 'uploadedData'
        onBack={() => setStep("import")} // Changed from 'handleBack'
        onCancel={onCancel} // Changed from 'handleCancel'
        onGenerate={() => {
          handleGenerate();
          onNavigate("seating"); // ✅ This routes to Seating Allocation
        }}
      />
    )}
    </div>
    
  )
}
