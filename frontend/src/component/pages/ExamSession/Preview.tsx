"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from "lucide-react"
import type { StudentRow } from "./ExamSessionWizard"

interface DataPreviewProps {
  data: StudentRow[]
  onBack: () => void
  onGenerate: () => void
  onCancel: () => void
}

export function DataPreview({ data, onBack, onGenerate, onCancel }: DataPreviewProps) {
  const validCount = data.filter((row) => row.valid).length
  const errorCount = data.filter((row) => !row.valid).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Data Preview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Review the uploaded data before generating the seating plan
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">{validCount} Valid</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-foreground">{errorCount} Errors</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Reg No</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Slot</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={`row-${row.regNo}-${index}`}
                  className={!row.valid ? "bg-red-50" : ""}
                >
                  <TableCell className="font-mono text-sm">
                    {row.regNo || <span className="text-red-500 italic">Missing</span>}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    {row.subject || <span className="text-red-500 italic">Missing</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      Slot {row.slot}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-red-600">{row.error}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {errorCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> {errorCount} row(s) have errors and will be skipped during
              allocation. You can go back and fix the CSV file, or proceed with valid entries only.
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
          <Button onClick={onGenerate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Seating Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
