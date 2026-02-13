"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { StudentRow } from "./ExamSessionWizard"

interface UploadedFile {
  subject: string
  fileName: string
}

export function DataImportAutonomous({
  onUpload,
  onBack,
}: {
  onUpload: (data: StudentRow[]) => void
  onBack: () => void
}) {
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleAddFile = (subject: string, file: File) => {
    setFiles([...files, { subject, fileName: file.name }])
  }

  const handleContinue = () => {
    const dummyData: StudentRow[] = [
      {
        regNo: "AUTO001",
        name: "Auto Student",
        subject: files[0]?.subject || "Subject",
        slot: "A",
        valid: true,
      },
    ]

    onUpload(dummyData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Subject-wise CSV Files</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Subject Name"
            id="subject"
            className="border p-2 rounded w-full"
          />

          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const subject = (
                document.getElementById("subject") as HTMLInputElement
              ).value
              if (e.target.files && subject) {
                handleAddFile(subject, e.target.files[0])
              }
            }}
          />
        </div>

        <div>
          {files.map((f, i) => (
            <p key={i} className="text-sm">
              {f.subject} → {f.fileName}
            </p>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button disabled={!files.length} onClick={handleContinue}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}