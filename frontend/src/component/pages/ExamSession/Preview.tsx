"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import * as XLSX from "xlsx"

interface PreviewProps {
  payload: any
  onBack: () => void
  onCancel: () => void
  onGenerate: () => void
}

const PAGE_SIZE = 10

// Maps display label → possible raw header variations (lowercase, trimmed)
const COLUMN_MAP: { label: string; keywords: string[] }[] = [
  { label: "Student",     keywords: ["student"] },
  { label: "Branch Name", keywords: ["branch name", "branch"] },
  { label: "Event",       keywords: ["event"] },
  { label: "Slot",        keywords: ["slot"] },
  { label: "Course",      keywords: ["course"] },
]

function extractColumns(rawRows: any[][]): { headers: string[]; rows: any[][] } {
  if (rawRows.length < 2) return { headers: [], rows: [] }

  // Try each row as a potential header row (title rows often sit above)
  let headerRowIdx = 0
  let foundIndices: number[] = []

  for (let r = 0; r < Math.min(5, rawRows.length); r++) {
    const candidate = rawRows[r].map((c: any) => String(c ?? "").replace(/\s+/g, " ").trim().toLowerCase())
    const indices = COLUMN_MAP.map(col =>
      candidate.findIndex(h => col.keywords.some(kw => h.includes(kw)))
    )
    if (indices.filter(i => i !== -1).length >= 3) {
      headerRowIdx = r
      foundIndices = indices
      break
    }
  }

  const headers: string[] = []
  const colIndices: number[] = []

  COLUMN_MAP.forEach((col, i) => {
    if (foundIndices[i] !== -1) {
      headers.push(col.label)
      colIndices.push(foundIndices[i])
    }
  })

  const dataRows = rawRows.slice(headerRowIdx + 1).map(row =>
    colIndices.map(i => String(row[i] ?? "").replace(/\s+/g, " ").trim())
  )

  return { headers, rows: dataRows }
}

export default function Preview({ payload, onBack, onCancel, onGenerate }: PreviewProps) {
  const [headers, setHeaders] = useState<string[]>([])
  const [allRows, setAllRows] = useState<string[][]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE))
  const pagedRows = allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (!payload?.files?.length) return
    const file = payload.files[0]
    setLoading(true)

    const reader = new FileReader()

    reader.onload = (e: any) => {
      try {
        const data = e.target.result
        let rawRows: any[][] = []

        if (file.name.toLowerCase().endsWith(".csv")) {
          const text = data as string
          rawRows = text.split("\n").filter(Boolean).map((r: string) => r.split(","))
        } else if (/\.(xlsx|xls)$/i.test(file.name)) {
          const workbook = XLSX.read(data, { type: "binary" })
          // Use the first sheet (main data sheet)
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
        }

        const { headers, rows } = extractColumns(rawRows)
        setHeaders(headers)
        setAllRows(rows)
        setPage(1)
      } finally {
        setLoading(false)
      }
    }

    file.name.toLowerCase().endsWith(".csv")
      ? reader.readAsText(file)
      : reader.readAsBinaryString(file)
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
          <p className="font-medium mb-1">Uploaded Files:</p>
          {payload?.files?.map((file: File, i: number) => (
            <p key={i} className="text-sm text-muted-foreground">{file.name}</p>
          ))}
        </div>

        {/* ROW COUNT */}
        <div>
          <p className="font-medium">
            Total Entries:{" "}
            <span className="text-blue-600">{allRows.length.toLocaleString()}</span>
          </p>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Loading preview…
          </div>
        ) : headers.length === 0 ? (
          <div className="border rounded p-4 text-sm text-red-500">
            Could not find expected columns. Make sure the file has: Student, Branch Name, Event, Slot, Course.
          </div>
        ) : (
          <div className="overflow-auto border rounded max-h-72">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, i) => (
                  <tr key={i} className={`border-b last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 border-r last:border-r-0 whitespace-nowrap max-w-xs truncate" title={cell}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
              {Math.min(page * PAGE_SIZE, allRows.length).toLocaleString()} of {allRows.length.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 border rounded text-xs font-medium min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline" size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* TAGS */}
        {payload?.tags && (
          <div>
            <p className="font-medium mb-2">Tags:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-28">
              {JSON.stringify(payload.tags, null, 2)}
            </pre>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onGenerate} disabled={allRows.length === 0}>
              Generate Seating <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}