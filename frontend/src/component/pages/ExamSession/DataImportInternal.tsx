"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight, Trash2 } from "lucide-react"
import { Input } from "../../ui/input"

interface FileWithTags {
  id: string
  file: File
  subjectName: string
  subjectCode: string
  dept: string
  division: string
  semester: string
}

export function DataImportInternal({ onUpload, onBack }: { onUpload: (data: any) => void; onBack: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileEntries, setFileEntries] = useState<FileWithTags[]>([])

  const processFiles = (files: File[]) => {
    const newEntries = files.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      subjectName: "",
      subjectCode: "",
      dept: "",
      division: "",
      semester: ""
    }))
    setFileEntries(prev => [...prev, ...newEntries])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => /\.(csv|xlsx|xls)$/i.test(f.name))
    processFiles(dropped)
  }, [])

  const updateTag = (id: string, field: keyof FileWithTags, value: string) => {
    setFileEntries(prev => prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry))
  }

  const removeFile = (id: string) => setFileEntries(prev => prev.filter(e => e.id !== id))

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Internal Exam Upload</CardTitle>
        <p className="text-sm text-muted-foreground">Upload files and tag specific details for each</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Image Clone UI: Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-lg">Upload Student Data</p>
              <p className="text-sm text-muted-foreground">Drag and drop your files here, or click to browse</p>
            </div>
            <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" id="file-input" 
              onChange={(e) => processFiles(Array.from(e.target.files || []))} 
            />
            <label htmlFor="file-input">
              <Button variant="outline" asChild className="cursor-pointer">
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </div>

        {/* Per-File Tagging Section */}
        <div className="space-y-4">
          {fileEntries.map((entry) => (
            <div key={entry.id} className="p-4 border rounded-lg bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-sm font-semibold truncate max-w-xs">{entry.file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(entry.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Input placeholder="Course Name" value={entry.subjectName} onChange={e => updateTag(entry.id, "subjectName", e.target.value)} />
                <Input placeholder="Course Code" value={entry.subjectCode} onChange={e => updateTag(entry.id, "subjectCode", e.target.value)} />
                <Input placeholder="Department" value={entry.dept} onChange={e => updateTag(entry.id, "dept", e.target.value)} />
                <Input placeholder="Semester" value={entry.semester} onChange={e => updateTag(entry.id, "semester", e.target.value)} />
                <Input placeholder="Division (e.g. A, B)" value={entry.division} onChange={e => updateTag(entry.id, "division", e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button 
            disabled={fileEntries.length === 0} 
            onClick={() => onUpload({ type: "internal", data: fileEntries })}
          >
            Preview Data
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}