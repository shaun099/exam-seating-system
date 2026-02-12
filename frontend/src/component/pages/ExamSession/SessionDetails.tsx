"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Label } from "../../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert"
import { Info, Settings, ArrowRight } from "lucide-react"

interface SessionDetailsProps {
  config: {
    rows: number
    columns: number
    maxCapacity: number
    interleaving: boolean
  }
  onSubmit: (data: { batchType: string; examMode: string }) => void
  onCancel: () => void
  onChangeConfig: () => void
}

export function SessionDetails({
  config,
  onSubmit,
  onCancel,
  onChangeConfig,
}: SessionDetailsProps) {
  const [batchType, setBatchType] = useState("")
  const [examMode, setExamMode] = useState("")

  const handleSubmit = () => {
    if (batchType && examMode) {
      onSubmit({ batchType, examMode })
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
        {/* Dropdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="batchType">Batch Type</Label>
            <Select value={batchType} onValueChange={setBatchType}>
              <SelectTrigger
                id="batchType"
                className="bg-white border border-gray-300"
              >
                <SelectValue placeholder="Select batch type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ktu">KTU</SelectItem>
                <SelectItem value="autonomous">Autonomous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examMode">Exam Mode</Label>
            <Select value={examMode} onValueChange={setExamMode}>
              <SelectTrigger
                id="examMode"
                className="bg-white border border-gray-300"
              >
                <SelectValue placeholder="Select exam mode" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Configuration Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">
            Current System Configuration
          </AlertTitle>

          <AlertDescription className="text-blue-700">
            <div className="mt-2 space-y-1 text-sm">
              <p>
                Default Room Matrix:{" "}
                <strong>
                  {config.rows} Rows × {config.columns} Columns
                </strong>
              </p>
              <p>
                Max Capacity per Room:{" "}
                <strong>{config.maxCapacity} Students</strong>
              </p>
              <p>
                Department Interleaving:{" "}
                <strong>
                  {config.interleaving ? "Enabled" : "Disabled"}
                </strong>
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Change Configurations */}
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <Button
            variant="link"
            className="p-0 h-auto text-primary"
            onClick={onChangeConfig}
          >
            Change Configurations
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!batchType || !examMode}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
