"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import * as XLSX from "xlsx"

interface PreviewProps {
  payload: any
  onBack: () => void
  onCancel: () => void
  onGenerate: () => void
}

export default function Preview({
  payload,
  onBack,
  onCancel,
  onGenerate,
}: PreviewProps) {
  const [previewData, setPreviewData] = useState<any[]>([])
  const [rowCount, setRowCount] = useState(0)

  useEffect(() => {
    if (!payload?.files) return

    const file = payload.files[0] // show first file preview

    const reader = new FileReader()

    reader.onload = (e: any) => {
      const data = e.target.result

      // CSV
      if (file.name.endsWith(".csv")) {
        const text = data as string
        const rows = text.split("\n").map(r => r.split(","))

        setPreviewData(rows.slice(0, 10)) // show first 10 rows
        setRowCount(rows.length)
      }

      // Excel
      else if (/\.(xlsx|xls)$/i.test(file.name)) {
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        setPreviewData(jsonData.slice(0, 10))
        setRowCount(jsonData.length)
      }
    }

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }

  }, [payload])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Preview Data</CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify uploaded file and tags before generating seating
        </p>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* FILE LIST */}
        <div>
          <p className="font-medium mb-2">Uploaded Files:</p>
          {payload?.files?.map((file: File, i: number) => (
            <p key={i} className="text-sm text-muted-foreground">
              {file.name}
            </p>
          ))}
        </div>

        {/* ROW COUNT */}
        <div>
          <p className="font-medium">
            Total Entries: <span className="text-blue-600">{rowCount}</span>
          </p>
        </div>

        {/* TABLE PREVIEW */}
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i} className="border-b">
                  {row.map((cell: any, j: number) => (
                    <td key={j} className="px-2 py-1 border-r">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TAGS (already passed) */}
        {payload?.tags && (
          <div>
            <p className="font-medium mb-2">Tags:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(payload.tags, null, 2)}
            </pre>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            <Button onClick={onGenerate}>
              Generate Seating
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}