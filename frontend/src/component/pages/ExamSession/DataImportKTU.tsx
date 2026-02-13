"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Upload, ArrowLeft, ArrowRight } from "lucide-react"
import type { StudentRow } from "./ExamSessionWizard"

export function DataImportKTU({
  onUpload,
  onBack,
}: {
  onUpload: (data: StudentRow[]) => void
  onBack: () => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)

  const handleContinue = () => {
    const dummyData: StudentRow[] = [
      {
        regNo: "KTU001",
        name: "Student One",
        subject: "Data Structures",
        slot: "A",
        valid: true,
      },
    ]

    onUpload(dummyData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Student CSV (KTU)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="border-2 border-dashed rounded-lg p-10 text-center">
          <Upload className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Upload single CSV file
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              e.target.files && setFileName(e.target.files[0].name)
            }
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button disabled={!fileName} onClick={handleContinue}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}