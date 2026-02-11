"use client"

import { useState, useCallback } from "react"
import { SessionDetails } from "./session-details"
import { DataImport } from "./data-import"
import { DataPreview } from "./data-preview"

interface SessionWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export type WizardStep = "details" | "import" | "preview"

export interface StudentRow {
  regNo: string
  name: string
  subject: string
  slot: string
  valid: boolean
  error?: string
}

export function SessionWizard({ onComplete, onCancel }: SessionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("details")
  const [, setSessionData] = useState({
    batchType: "",
    examCategory: "",
  })
  const [uploadedData, setUploadedData] = useState<StudentRow[]>([])

  const handleDetailsSubmit = (data: { batchType: string; examCategory: string }) => {
    setSessionData(data)
    setCurrentStep("import")
  }

  const handleFileUpload = useCallback((data: StudentRow[]) => {
    setUploadedData(data)
    setCurrentStep("preview")
  }, [])

  const handleBackToImport = () => {
    setCurrentStep("import")
  }

  const handleGenerate = () => {
    onComplete()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[
            { id: "details", label: "Session Details", step: 1 },
            { id: "import", label: "Data Import", step: 2 },
            { id: "preview", label: "Preview & Generate", step: 3 },
          ].map((item, index) => {
            const isActive = currentStep === item.id
            const isCompleted =
              (item.id === "details" && (currentStep === "import" || currentStep === "preview")) ||
              (item.id === "import" && currentStep === "preview")

            return (
              <div key={item.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? "✓" : item.step}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {index < 2 && <div className="w-16 h-px bg-border mx-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === "details" && (
        <SessionDetails onSubmit={handleDetailsSubmit} onCancel={onCancel} />
      )}

      {currentStep === "import" && (
        <DataImport
          onUpload={handleFileUpload}
          onBack={() => setCurrentStep("details")}
        />
      )}

      {currentStep === "preview" && (
        <DataPreview
          data={uploadedData}
          onBack={handleBackToImport}
          onGenerate={handleGenerate}
          onCancel={onCancel}
        />
      )}
    </div>
  )
}
