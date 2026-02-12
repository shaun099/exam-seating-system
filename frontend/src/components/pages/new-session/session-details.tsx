"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Settings, ArrowRight } from "lucide-react"

interface SessionDetailsProps {
  onSubmit: (data: { batchType: string; examCategory: string }) => void
  onCancel: () => void
}

export function SessionDetails({ onSubmit, onCancel }: SessionDetailsProps) {
  const [batchType, setBatchType] = useState("")
  const [examCategory, setExamCategory] = useState("")

  const handleSubmit = () => {
    if (batchType && examCategory) {
      onSubmit({ batchType, examCategory })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Session Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure the basic details for the new exam session
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="batchType">Batch Type</Label>
            <Select value={batchType} onValueChange={setBatchType}>
              <SelectTrigger id="batchType">
                <SelectValue placeholder="Select batch type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ktu">KTU</SelectItem>
                <SelectItem value="autonomous">Autonomous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examCategory">Exam Category</Label>
            <Select value={examCategory} onValueChange={setExamCategory}>
              <SelectTrigger id="examCategory">
                <SelectValue placeholder="Select exam category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Current System Configuration</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="mt-2 space-y-1 text-sm">
              <p>Default Room Matrix: <strong>6 Rows × 5 Columns</strong></p>
              <p>Max Capacity per Room: <strong>30 Students</strong></p>
              <p>Department Interleaving: <strong>Enabled</strong></p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <button className="text-sm text-primary hover:underline">
            Change Configurations
          </button>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!batchType || !examCategory}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
