"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight } from "lucide-react"

interface DataImportKTUProps {
  onUpload: (data: { type: string; files: File[] }) => void
  onBack: () => void
}

export function DataImportKTU({ onUpload, onBack }: DataImportKTUProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const dropped = e.dataTransfer.files
    const f = dropped[0]

    if (f && /\.(csv|xlsx|xls)$/i.test(f.name)) {
      setFile(f)
    }
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
    const selected = e.target.files[0]

    if (/\.(csv|xlsx|xls)$/i.test(selected.name)) {
      setFile(selected)
    }
  }

  const handleContinue = () => {
    if (!file) return

    onUpload({
      type: "ktu_university",
      files: [file]
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">KTU Batch Appearance List</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload the consolidated file
        </p>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* 🔥 YOUR ORIGINAL UI — UNTOUCHED */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : file
                ? "border-emerald-500 bg-emerald-50"
                : "border-border hover:border-primary/50"
          }`}
        >
          {file ? (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  File ready for processing
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
              >
                Remove File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>

              <div>
                <p className="font-medium text-foreground">
                  Upload Student Data
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your file here, or click to browse
                </p>
              </div>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="ktu-upload"
              />

              <label htmlFor="ktu-upload">
                <Button variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* 🔽 NOTHING EXTRA FOR KTU UNIVERSITY */}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button onClick={handleContinue} disabled={!file}>
            Preview Data
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}