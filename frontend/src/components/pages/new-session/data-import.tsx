"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Download, ArrowLeft, ArrowRight } from "lucide-react"
import type { StudentRow } from "./session-wizard"

interface DataImportProps {
  onUpload: (data: StudentRow[]) => void
  onBack: () => void
}

const sampleData: StudentRow[] = [
  { regNo: "SJCET21CS001", name: "Arun Kumar", subject: "Data Structures", slot: "A", valid: true },
  { regNo: "SJCET21CS002", name: "Priya Sharma", subject: "Data Structures", slot: "A", valid: true },
  { regNo: "SJCET21EC003", name: "Rahul Menon", subject: "Digital Electronics", slot: "A", valid: true },
  { regNo: "SJCET21ME004", name: "Sneha Nair", subject: "Thermodynamics", slot: "B", valid: true },
  { regNo: "SJCET21CS005", name: "Vishnu Das", subject: "Database Systems", slot: "B", valid: true },
  { regNo: "SJCET21EC006", name: "Anjali Thomas", subject: "Microprocessors", slot: "A", valid: true },
  { regNo: "SJCET21CS007", name: "Mohammed Ali", subject: "Data Structures", slot: "A", valid: true },
  { regNo: "SJCET21ME008", name: "Lakshmi Pillai", subject: "Fluid Mechanics", slot: "B", valid: true },
  { regNo: "", name: "Unknown Student", subject: "Data Structures", slot: "A", valid: false, error: "Missing Registration Number" },
  { regNo: "SJCET21CS010", name: "Deepak Raj", subject: "", slot: "A", valid: false, error: "Missing Subject" },
]

export function DataImport({ onUpload, onBack }: DataImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setFileName(files[0].name)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setFileName(files[0].name)
    }
  }, [])

  const handleContinue = () => {
    // Simulate processing the file and return sample data
    onUpload(sampleData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Data Import</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload the student data CSV file to proceed with allocation
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : fileName
                ? "border-emerald-500 bg-emerald-50"
                : "border-border hover:border-primary/50"
          }`}
        >
          {fileName ? (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">{fileName}</p>
                <p className="text-sm text-muted-foreground">File ready for processing</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFileName(null)}
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
                <p className="font-medium text-foreground">Upload Student Data CSV</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your file here, or click to browse
                </p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Download Template */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <Download className="w-4 h-4 text-muted-foreground" />
          <button className="text-primary hover:underline">
            Download Sample CSV Template
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleContinue} disabled={!fileName}>
            Preview Data
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
