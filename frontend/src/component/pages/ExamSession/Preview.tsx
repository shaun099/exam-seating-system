"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { CheckCircle2, FileText, ArrowLeft, X, FileSpreadsheet } from "lucide-react"

interface PreviewProps {
  payload: any
  onBack: () => void
  onCancel: () => void
  onGenerate: () => void 
}

export default function Preview({ payload, onBack, onCancel, onGenerate }: PreviewProps) {
  const typeLabels: Record<string, string> = {
    ktu_university: "KTU Batch List",
    internal: "Internal Exam",
    autonomous: "Autonomous University"
  }

  const isInternal = payload.type === "internal";

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm">
      <CardHeader className="border-b bg-muted/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Import Preview
            </CardTitle>
            <p className="text-sm text-muted-foreground">Verify file mappings before generation</p>
          </div>
          <Badge variant="outline" className="bg-background px-3 py-1 capitalize font-bold">
            {typeLabels[payload.type]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-6 space-y-6">
        <div className="space-y-4">
          {payload.data ? (
            payload.data.map((item: any, i: number) => (
              <div key={i} className="border rounded-xl overflow-hidden bg-background shadow-sm">
                <div className="bg-slate-50 border-b p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-900 truncate">{item.file.name}</span>
                  </div>
                </div>

                <div className={`p-5 grid grid-cols-1 md:grid-cols-${isInternal ? 3 : 1} gap-8`}>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Course</p>
                    <p className="text-base font-normal text-slate-900">{item.subjectName}-{item.subjectCode}</p>
                  </div>
                  {isInternal && (
                    <>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Department & Class</p>
                        <p className="text-base font-normal text-slate-900">{item.dept}-{item.division}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Semester</p>
                        <p className="text-base font-normal text-slate-900">{item.semester || "—"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            payload.files?.map((file: File, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Badge variant="outline" className="font-bold">KTU List</Badge>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t mt-8">
          <Button variant="ghost" onClick={onCancel} className="text-slate-500">Discard</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>Edit Tags</Button>
            {/* ✅ This button now triggers the route to "seating" in App.tsx */}
            <Button onClick={onGenerate} className="bg-slate-800 hover:bg-slate-900 text-white px-8">
              Confirm & Generate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}