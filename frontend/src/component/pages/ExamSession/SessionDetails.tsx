"use client"

import { useEffect, useState } from "react"
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

const SEATING_DEFAULTS_STORAGE_KEY = "seating-default-matrix"

interface SessionDetailsProps {
  config: {
    rows: number
    columns: number
    maxCapacity: number
    interleaving: boolean
  }
  onSubmit: (data: { batchType: string; examMode: string }) => void
  onCancel: () => void
  onNavigate: (page: string) => void   // ✅ Add this
}

export function SessionDetails({
  config,
  onSubmit,
  onCancel,
  onNavigate,
}: SessionDetailsProps) {
  const [batchType, setBatchType] = useState("")
  const [examMode, setExamMode] = useState("")
  const [displayConfig, setDisplayConfig] = useState(config)

  const getLatestDisplayConfig = () => {
    const fallbackRows = config.rows > 0 ? config.rows : 6
    const fallbackCols = config.columns > 0 ? config.columns : 5

    try {
      const raw = localStorage.getItem(SEATING_DEFAULTS_STORAGE_KEY)
      if (!raw) {
        return {
          ...config,
          rows: fallbackRows,
          columns: fallbackCols,
          maxCapacity: fallbackRows * fallbackCols,
        }
      }

      const parsed = JSON.parse(raw) as { rows?: number; cols?: number }
      const rows = Number(parsed.rows)
      const cols = Number(parsed.cols)
      const resolvedRows = Number.isFinite(rows) && rows > 0 ? rows : fallbackRows
      const resolvedCols = Number.isFinite(cols) && cols > 0 ? cols : fallbackCols

      return {
        ...config,
        rows: resolvedRows,
        columns: resolvedCols,
        maxCapacity: resolvedRows * resolvedCols,
      }
    } catch {
      return {
        ...config,
        rows: fallbackRows,
        columns: fallbackCols,
        maxCapacity: fallbackRows * fallbackCols,
      }
    }
  }

  useEffect(() => {
    setDisplayConfig(getLatestDisplayConfig())
  }, [config.rows, config.columns, config.maxCapacity, config.interleaving])

  useEffect(() => {
    const refreshDisplayConfig = () => {
      setDisplayConfig(getLatestDisplayConfig())
    }

    const onVisibilityChange = () => {
      if (!document.hidden) {
        refreshDisplayConfig()
      }
    }

    window.addEventListener("storage", refreshDisplayConfig)
    window.addEventListener("focus", refreshDisplayConfig)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("storage", refreshDisplayConfig)
      window.removeEventListener("focus", refreshDisplayConfig)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [config.rows, config.columns, config.maxCapacity, config.interleaving])

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
                  {displayConfig.rows} Rows × {displayConfig.columns} Columns
                </strong>
              </p>
              <p>
                Max Capacity per Room:{" "}
                <strong>{displayConfig.maxCapacity} Students</strong>
              </p>
              <p>
                Department Interleaving:{" "}
                <strong>
                  {displayConfig.interleaving ? "Enabled" : "Disabled"}
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
            onClick={() => onNavigate("configurations")} 
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