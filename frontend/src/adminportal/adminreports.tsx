import { useEffect, useMemo, useState } from "react"
import {
  Download,
  FileText,
  FolderArchive,
  ClipboardList,
  Users,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/component/ui/button"

interface AdminReportsProps {
  onLogout: () => void
  onNavigate: (page: string) => void
}

interface SlotSummaryApiItem {
  event_name: string
  slot: string
  date: string
  session: string
}

interface SlotSummaryApiResponse {
  data: SlotSummaryApiItem[]
}

interface SlotOption {
  id: string
  name: string
  date: string
  session: string
  eventName: string
}

interface SemesterOption {
  id: string
  name: string
  slots: SlotOption[]
}

const API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "")
const SLOT_SUMMARY_ENDPOINT = `${API_BASE}/api/v1/seat-allocations/slots-summary`

const extractSemesterFromEventName = (eventName: string) => {
  const match = eventName.match(/\bS\d+\b/i)
  return (match?.[0] || "UNKNOWN").toUpperCase()
}

const semesterSortValue = (semesterCode: string) => {
  const match = semesterCode.match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

const toTime = (date: string) => {
  const time = new Date(date).getTime()
  return Number.isFinite(time) ? time : 0
}

const slotSortValue = (slotName: string) => {
  const code = slotName.replace(/^slot\s+/i, "").trim().toUpperCase()
  const ch = code.charCodeAt(0)
  return Number.isFinite(ch) ? ch : Number.MAX_SAFE_INTEGER
}

const normalizeSlotData = (items: SlotSummaryApiItem[]): SemesterOption[] => {
  const semesterMap = new Map<string, SlotOption[]>()

  for (const item of items) {
    const semesterCode = extractSemesterFromEventName(item.event_name)
    const slotCode = item.slot.trim().toUpperCase()
    if (!semesterMap.has(semesterCode)) {
      semesterMap.set(semesterCode, [])
    }

    semesterMap.get(semesterCode)!.push({
      id: `${semesterCode.toLowerCase()}-${slotCode.toLowerCase()}-${item.date}-${item.session}`,
      name: `Slot ${slotCode}`,
      date: item.date,
      session: item.session,
      eventName: item.event_name,
    })
  }

  return Array.from(semesterMap.entries())
    .sort(([a], [b]) => {
      const sortDiff = semesterSortValue(a) - semesterSortValue(b)
      return sortDiff !== 0 ? sortDiff : a.localeCompare(b)
    })
    .map(([semesterCode, slots]) => ({
      id: semesterCode.toLowerCase(),
      name: semesterCode,
      slots: slots.sort((a, b) => {
        const dateDiff = toTime(b.date) - toTime(a.date)
        return dateDiff !== 0 ? dateDiff : slotSortValue(a.name) - slotSortValue(b.name)
      }),
    }))
}

const getReportSlotCode = (slotName: string) =>
  slotName.replace(/^slot\s+/i, "").trim().toUpperCase()

const handleDownload = async (type: string, sem: string, slot: string) => {
  const endpointMap: Record<string, string> = {
    seating: `/api/v1/download/seating/${sem}/${slot}`,
    matrix: `/api/v1/download/classMatrix/${sem}/${slot}`,
    attendance: `/api/v1/download/attendencesheet/${sem}/${slot}`,
    duty: `/api/v1/download/duty/${sem}/${slot}`,
  }

  const endpoint = endpointMap[type]
  if (!endpoint) {
    window.alert("Unsupported report type.")
    return
  }

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) {
      throw new Error(`Download failed (${response.status}).`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}_${sem}_${slot}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    window.alert(err instanceof Error ? err.message : "Download failed")
  }
}

const reportTypes = [
  {
    id: "seating",
    title: "Consolidated Seating",
    description: "Complete seating arrangement for all rooms",
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
  },
  {
    id: "matrix",
    title: "Classroom Matrix",
    description: "Individual seating matrices for each classroom",
    icon: FolderArchive,
    color: "text-amber-600 bg-amber-50",
  },
  {
    id: "attendance",
    title: "Attendance Sheets",
    description: "Pre-formatted attendance sheets for invigilators",
    icon: ClipboardList,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "duty",
    title: "Duty Chart",
    description: "Invigilator duty assignments by room and slot",
    icon: Users,
    color: "text-purple-600 bg-purple-50",
  },
]

export default function AdminReports({ onLogout, onNavigate }: AdminReportsProps) {
  const [semesters, setSemesters] = useState<SemesterOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSemId, setActiveSemId] = useState<string | null>(null)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchSlotSummary = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!API_BASE) {
          throw new Error("VITE_API_URL is not configured.")
        }

        const token = localStorage.getItem("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined

        const response = await fetch(SLOT_SUMMARY_ENDPOINT, {
          signal: controller.signal,
          headers,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch slot summary: ${response.status}`)
        }

        const payload = (await response.json()) as SlotSummaryApiResponse
        const normalized = normalizeSlotData(payload.data ?? [])
        setSemesters(normalized)
      } catch (fetchError) {
        if (controller.signal.aborted) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load slot summary.")
        setSemesters([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchSlotSummary()
    return () => controller.abort()
  }, [])

  const selectedSem = semesters.find((s) => s.id === activeSemId)
  const availableSlots = selectedSem?.slots ?? []
  const selectedSlot = availableSlots.find((sl) => sl.id === activeSlotId)

  const recentReports = useMemo(() => {
    return semesters
      .flatMap((sem) =>
        sem.slots.map((slot) => ({
          semId: sem.id,
          slotId: slot.id,
          semName: sem.name,
          slotName: slot.name,
          date: slot.date,
          session: slot.session,
          eventName: slot.eventName,
        })),
      )
      .sort((a, b) => toTime(b.date) - toTime(a.date))
      .slice(0, 4)
  }, [semesters])

  const goBack = () => {
    if (activeSlotId) {
      setActiveSlotId(null)
      return
    }
    if (activeSemId) {
      setActiveSemId(null)
      return
    }
    onNavigate("admin")
  }

  return (
    <div className="h-screen flex flex-col bg-[#fafafa] text-slate-900 antialiased">
      <header className="h-16 bg-slate-800 text-white shadow-lg border-b border-slate-700 flex items-center shrink-0">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Administrator Reports</h1>
              <p className="text-[11px] text-slate-300">Preview generated reports by semester and slot</p>
            </div>
          </div>
          <Button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto max-w-7xl mx-auto px-8 py-10 w-full">
        <button
          onClick={goBack}
          className="group mb-8 flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          {activeSlotId
            ? "Back to Slot Selection"
            : activeSemId
              ? "Back to Semesters"
              : "Back to Admin Dashboard"}
        </button>

        {isLoading ? (
          <div className="animate-in fade-in duration-500">
            <p className="text-slate-500 font-medium">Loading slot summary...</p>
          </div>
        ) : error ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to load slots</h2>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !activeSemId ? (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex flex-col gap-1 mb-6">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Reports</h3>
              <h2 className="text-2xl font-bold text-slate-800">Latest Generated Reports</h2>
            </div>

            <div className="space-y-6">
              {recentReports.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8">
                  <p className="text-slate-500 font-medium">No slot data available.</p>
                </div>
              )}
              {recentReports.map((report, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50"
                >
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-800">
                        {report.semName} • {report.slotName}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium">
                        {report.date} • {report.session}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSemId(report.semId)
                        setActiveSlotId(report.slotId)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      View All <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {reportTypes.map((rpt, idx) => (
                      <div
                        key={rpt.id}
                        className={cn(
                          "p-8 group hover:bg-slate-50 transition-colors border-slate-100",
                          idx !== 3 && "lg:border-r",
                          idx < 2 && "border-b sm:border-b-0",
                          idx === 1 && "lg:border-b-0",
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", rpt.color)}>
                          <rpt.icon size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-tight mb-2">{rpt.title}</p>
                        <p className="text-xs text-slate-400 font-medium mb-6 line-clamp-2 leading-relaxed">
                          {rpt.description}
                        </p>
                        <button
                          onClick={() => {
                            if (rpt.id === "matrix") {
                              localStorage.setItem("classMatrix.sem", extractSemesterFromEventName(report.eventName))
                              localStorage.setItem("classMatrix.slot", getReportSlotCode(report.slotName))
                              onNavigate("class-matrix-preview")
                              return
                            }

                            void handleDownload(rpt.id, report.semName, getReportSlotCode(report.slotName))
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all uppercase tracking-wider"
                        >
                          <Download size={14} /> {rpt.id === "matrix" ? "Preview" : "Download"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !activeSlotId ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-4xl font-bold tracking-tight mb-8 text-slate-800">{selectedSem?.name}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setActiveSlotId(slot.id)}
                  className="p-8 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-600 hover:ring-1 hover:ring-blue-600 transition-all group shadow-sm"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                    Session
                  </span>
                  <h4 className="text-2xl font-bold mt-1 tracking-tight text-slate-800">{slot.name}</h4>
                  <p className="text-xs font-medium text-slate-500 mt-2">{slot.date}</p>
                  <p className="text-xs font-medium text-slate-500">{slot.session}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveSlotId(null)}
                  className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm bg-white"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{selectedSem?.name}</p>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800">{selectedSlot?.name} Reports</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {selectedSlot?.date} • {selectedSlot?.session}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-[1.5rem] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", report.color)}>
                      <report.icon size={26} />
                    </div>
                    <div>
                      <span className="text-[16px] font-bold text-slate-800 tracking-tight block mb-0.5">
                        {report.title}
                      </span>
                      <p className="text-xs text-slate-400 font-medium">{report.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (report.id === "matrix" && selectedSlot) {
                        localStorage.setItem("classMatrix.sem", extractSemesterFromEventName(selectedSlot.eventName))
                        localStorage.setItem("classMatrix.slot", getReportSlotCode(selectedSlot.name))
                        onNavigate("class-matrix-preview")
                        return
                      }

                      if (selectedSem && selectedSlot) {
                        void handleDownload(report.id, selectedSem.name, getReportSlotCode(selectedSlot.name))
                      }
                    }}
                    className="p-3.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}