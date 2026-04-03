"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { Card } from "@/component/ui/card"
import { Button } from "@/component/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/component/ui/table"
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react"

export default function BulkUpload({ onBack }: { onBack: () => void }) {
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const ws = workbook.Sheets[workbook.SheetNames[0]]
      
      // Step 1: Convert to 2D Array to find the REAL header row
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
      
      let headerIndex = -1
      let nameCol = -1
      let emailCol = -1

      // Step 2: Scan first 20 rows to find the header (Name/Email keywords)
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i]
        if (!row) continue
        
        nameCol = row.findIndex(cell => 
          /name|staff|faculty|user/i.test(String(cell))
        )
        emailCol = row.findIndex(cell => 
          /email|mail|id/i.test(String(cell))
        )

        if (nameCol !== -1 && emailCol !== -1) {
          headerIndex = i
          break
        }
      }

      // Step 3: If header found, extract data from subsequent rows
      if (headerIndex !== -1) {
        const extracted = rows.slice(headerIndex + 1)
          .map(row => ({
            name: row[nameCol]?.toString().trim() || "N/A",
            email: row[emailCol]?.toString().trim() || "N/A",
            selected: true
          }))
          .filter(u => u.email !== "N/A" && u.email.includes("@")) // Valid email check

        setPreviewData(extracted)
      } else {
        alert("Could not detect Name and Email columns. Please check your Excel headers.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSubmit = async () => {
    const selected = previewData.filter(u => u.selected)
    if (!selected.length) return alert("Please select staff to import.")

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/bulk-create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ users: selected, default_password: "adminpass" })
      })

      if (res.ok) {
        alert("Import Successful! Users can now login with 'adminpass'.")
        onBack()
      } else {
        const err = await res.json()
        alert(err.detail || "Upload failed")
      }
    } catch {
      alert("Backend connection error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ACTION BAR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h2 className="text-xl font-bold text-slate-800">Mass Staff Import</h2>
        </div>
        
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="border-slate-800 border-2 bg-white hover:bg-slate-50 text-slate-900 font-bold px-6 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Choose Excel File
          </Button>
          
          {previewData.length > 0 && (
            <Button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-md"
            >
              {loading ? "Processing..." : "Approve & Import"}
            </Button>
          )}
        </div>
      </div>

      {previewData.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50 py-20 flex flex-col items-center justify-center">
          <Upload className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Select an Excel or CSV file to begin extraction.</p>
        </Card>
      ) : (
        <Card className="shadow-xl border-green-100 overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex justify-between items-center">
            <h3 className="font-bold text-green-800 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Excel Preview: {previewData.length} Entries
            </h3>
            <div className="text-xs font-bold text-green-700 bg-white px-4 py-2 rounded-lg border border-green-200">
              DEFAULT PASSWORD: <span className="text-blue-700 uppercase">adminpass</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-24 text-center font-bold">Approve</TableHead>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((user, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50">
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={user.selected} 
                        className="w-5 h-5 accent-green-600 cursor-pointer"
                        onChange={() => {
                          const copy = [...previewData]
                          copy[idx].selected = !copy[idx].selected
                          setPreviewData(copy)
                        }} 
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{user.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}