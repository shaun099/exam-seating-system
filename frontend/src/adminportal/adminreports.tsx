"use client"

import { useState } from "react"
import { Card, CardContent } from "@/component/ui/card"
import { Button } from "@/component/ui/button"
import { Badge } from "@/component/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/component/ui/table"
import {
  FileText,
  FolderArchive,
  ClipboardList,
  Users,
  Eye,
  ArrowLeft,
  GraduationCap,
  LogOut,
  Loader2,
  Search,
  Database,
  RefreshCcw
} from "lucide-react"

interface AdminReportsProps {
  onLogout: () => void
  onNavigate: (page: string) => void
}

// Data Arrays
const semesters = Array.from({ length: 8 }, (_, i) => ({
  id: `s${i + 1}`,
  name: `Semester ${i + 1}`
}))

const allSlots = ["A", "B", "C", "D", "E", "F", "S", "T"].map(s => ({
  id: `slot-${s.toLowerCase()}`,
  name: `Slot ${s}`
}))

const reportTypes = [
  { id: "seating", title: "Consolidated Seating", icon: FileText },
  { id: "matrix", title: "Classroom Matrix", icon: FolderArchive },
  { id: "attendance", title: "Attendance Sheets", icon: ClipboardList },
  { id: "duty", title: "Duty Chart", icon: Users },
]

export default function AdminReports({ onLogout, onNavigate }: AdminReportsProps) {
  // Navigation States
  const [activeSemId, setActiveSemId] = useState<string | null>(null)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<any | null>(null)
  
  // Dynamic Data States
  const [reportData, setReportData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const selectedSem = semesters.find(s => s.id === activeSemId)
  const selectedSlot = allSlots.find(s => s.id === activeSlotId)

  // --- BACKEND INTEGRATION LOGIC ---
  const fetchReportData = async (reportId: string) => {
    const reportObj = reportTypes.find(r => r.id === reportId)
    setActiveReport(reportObj)
    setLoading(true)
    setReportData([]) // Initialize with empty state

    try {
      const token = localStorage.getItem("token")
      const API_URL = `${import.meta.env.VITE_API_URL}/admin/reports/view`
      
      const response = await fetch(`${API_URL}?semester=${activeSemId}&slot=${activeSlotId}&type=${reportId}`, {
        method: "GET",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
      })

      if (!response.ok) throw new Error("Backend Query Failed")
      
      const data = await response.json()
      // Expecting a JSON array of objects from your teammate's JOIN query
      setReportData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Critical Connection Error:", err)
      // Optional: Add a toast notification here
    } finally {
      setLoading(false)
    }
  }

  // Client-side search filtering
  const filteredData = reportData.filter(row => 
    Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans antialiased selection:bg-blue-100">
      {/* SYSTEM HEADER */}
      <header className="bg-slate-800 text-white shadow-2xl flex-shrink-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none">Administrator</h1>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.25em] mt-1">SJCET Examination Cell</p>
            </div>
          </div>
          <Button onClick={onLogout} className="bg-red-600 hover:bg-red-700 font-bold px-6 h-10 transition-all rounded-lg shadow-md">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      {/* CORE VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-10">
          
          {/* NAVIGATION BREADCRUMB */}
          <Button
            variant="ghost"
            onClick={() => {
              if (activeReport) { setActiveReport(null); setReportData([]); }
              else if (activeSlotId) setActiveSlotId(null)
              else if (activeSemId) setActiveSemId(null)
              else onNavigate("admin")
            }}
            className="mb-8 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {activeReport ? "Return to Report Selection" : activeSlotId ? "Return to Slot Grid" : activeSemId ? "Return to Semester Grid" : "Return to Dashboard"}
          </Button>

          {/* LEVEL 1: SEMESTER GRID */}
          {!activeSemId && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Select Semester</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {semesters.map(sem => (
                  <Card key={sem.id} onClick={() => setActiveSemId(sem.id)} className="cursor-pointer group hover:border-blue-600 border-2 border-transparent transition-all shadow-sm hover:shadow-2xl bg-white">
                    <CardContent className="p-12 text-center">
                        <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{sem.name}</h3>
                        <div className="mt-3 w-10 h-1 bg-slate-100 group-hover:bg-blue-600 mx-auto transition-all" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LEVEL 2: SLOT GRID */}
          {activeSemId && !activeSlotId && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-right-10 duration-300">
              <div className="flex items-center justify-between border-b-2 pb-6 border-slate-200">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedSem?.name} <span className="text-blue-600">Inventory</span></h2>
                <Badge className="bg-slate-900 text-white font-black px-6 py-2 rounded-full tracking-[0.2em] text-[10px]">CHOOSE EXAM SLOT</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {allSlots.map(slot => (
                  <Card key={slot.id} onClick={() => setActiveSlotId(slot.id)} className="cursor-pointer group hover:bg-blue-600 transition-all shadow-md border-slate-200 border bg-white">
                    <CardContent className="p-10 text-center">
                        <h3 className="text-3xl font-black text-slate-800 group-hover:text-white transition-colors">{slot.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LEVEL 3: REPORT TYPES */}
          {activeSlotId && !activeReport && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{selectedSem?.name} <span className="text-blue-600">/</span> {selectedSlot?.name}</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Ready for data visualization</p>
                </div>
                <Database className="w-10 h-10 text-slate-200 hidden md:block" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reportTypes.map(report => (
                  <Card key={report.id} className="border-2 border-transparent hover:border-blue-500 transition-all shadow-md bg-white overflow-hidden">
                    <CardContent className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-50 rounded-2xl"><report.icon className="w-8 h-8 text-blue-600" /></div>
                        <h3 className="font-black text-2xl text-slate-800 tracking-tight">{report.title}</h3>
                      </div>
                      <Button onClick={() => fetchReportData(report.id)} className="bg-slate-900 hover:bg-blue-700 text-white font-black px-8 h-14 rounded-xl shadow-lg transition-all tracking-widest text-xs">
                        <Eye className="w-5 h-5 mr-2" /> VIEW
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LEVEL 4: SYSTEM DATA VISUALIZER */}
          {activeReport && (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
              <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl bg-white">
                {/* Visualizer Context Header */}
                <div className="bg-slate-900 text-white p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-blue-600 text-white font-black tracking-widest text-[9px] px-4 py-1">LIVE DATA VIEW</Badge>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">{activeReport.title}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedSem?.name} <span className="text-blue-500">•</span> {selectedSlot?.name}</h2>
                  </div>
                  
                  <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Identity, Name or Hall..." 
                        className="w-full pl-12 pr-4 py-4 bg-slate-800 border-0 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-sm" 
                    />
                  </div>
                </div>

                {/* Main Data Table */}
                {loading ? (
                  <div className="h-[500px] flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
                        <Database className="w-8 h-8 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-slate-900 uppercase tracking-[0.4em] text-xs">Synchronizing Records</p>
                        <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase">Please wait while we join the backend tables</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto border-x border-slate-100">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-30 shadow-sm">
                        <TableRow className="border-b-2 border-slate-200">
                          <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest p-6">Primary Identity</TableHead>
                          <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest p-6">Student/Staff Name</TableHead>
                          <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest p-6">Hall/Classroom</TableHead>
                          <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest p-6">Allocation Metadata</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.length > 0 ? (
                          filteredData.map((row, i) => (
                            <TableRow key={i} className="hover:bg-blue-50/50 transition-colors border-b border-slate-100">
                              {/* Teammate Note: Ensure backend returns these keys or adjust to match API response */}
                              <TableCell className="p-6 font-black text-slate-500 text-sm">{row.admission_no || row.id || "N/A"}</TableCell>
                              <TableCell className="p-6 font-bold text-slate-900 text-sm tracking-tight">{row.full_name || row.name || "N/A"}</TableCell>
                              <TableCell className="p-6">
                                <span className="bg-slate-100 text-slate-800 px-4 py-2 rounded-lg text-[11px] font-black uppercase border border-slate-200">{row.room || row.hall || "N/A"}</span>
                              </TableCell>
                              <TableCell className="p-6 font-black text-blue-700 text-sm tracking-tighter uppercase">{row.seat || row.duty_area || "Not Assigned"}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-80 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-30">
                                    <RefreshCcw className="w-12 h-12 text-slate-400" />
                                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">No backend records synchronized</p>
                                </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Data View Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                        Authenticated Access <span className="mx-3 text-slate-300">|</span> Total Records Found: {filteredData.length}
                    </p>
                  </div>
                  <Button variant="outline" className="font-black text-[10px] uppercase tracking-widest border-slate-300 h-9" onClick={() => fetchReportData(activeReport.id)}>
                    <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Force Refresh
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* SYSTEM STATUS FOOTER */}
      <footer className="bg-slate-100 border-t py-3 px-6 flex-shrink-0">
        <p className="text-[9px] text-center text-slate-400 uppercase font-black tracking-[0.3em]">
          Internal Administrative Portal • SJCET Palai • Protected Environment
        </p>
      </footer>
    </div>
  )
}