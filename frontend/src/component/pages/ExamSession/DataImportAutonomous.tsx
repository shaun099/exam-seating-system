"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight } from "lucide-react"
import type { StudentRow } from "./ExamSessionWizard"

interface AutonomousImportProps {
  onUpload: (data: StudentRow[]) => void
  onBack: () => void
}
export function DataImportAutonomous({ onUpload, onBack }: AutonomousImportProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const csvFiles = droppedFiles.filter(f => f.name.endsWith(".csv"))

    setFiles(prev => [...prev, ...csvFiles])
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    // Minimal functionality for now
    const mockData: StudentRow[] = files.map(file => ({
      regNo: "AUTO001",
      name: "Sample Student",
      subject: file.name.replace(".csv", ""),
      slot: "A",
      valid: true
    }))

    onUpload(mockData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Autonomous Batch Appearance List</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload CSV files for each subject
        </p>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Drag & Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">Drag & Drop CSV Files Here</p>
            <input
              type="file"
              multiple
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="auto-upload"
            />
            <label htmlFor="auto-upload">
              <Button variant="outline" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">
                    {file.name.replace(".csv", "")}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button onClick={handleContinue} disabled={files.length === 0}>
            Preview Data
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}