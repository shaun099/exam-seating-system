"use client"

import { useState } from "react"
import { Card, CardContent } from "@/component/ui/card"
import { Button } from "@/component/ui/button"
import {
  FileText,
  FolderArchive,
  ClipboardList,
  Users,
  Download,
  ArrowLeft,
  GraduationCap,
  LogOut
} from "lucide-react"

interface AdminReportsProps {
  onLogout: () => void
  onNavigate: (page: string) => void
}
const semesters = [
  { id: "s1", name: "Semester 1" },
  { id: "s3", name: "Semester 3" },
  { id: "s5", name: "Semester 5" },
]

const slotsMap: Record<string, { id: string; name: string }[]> = {
  s1: [{ id: "s1a", name: "Slot A" }, { id: "s1b", name: "Slot B" }],
  s3: [
    { id: "s3a", name: "Slot A" },
    { id: "s3b", name: "Slot B" },
    { id: "s3c", name: "Slot C" },
  ],
  s5: [
    { id: "s5a", name: "Slot A" },
    { id: "s5b", name: "Slot B" },
    { id: "s5c", name: "Slot C" },
    { id: "s5d", name: "Slot D" },
  ],
}

const reportTypes = [
  { id: "seating", title: "Consolidated Seating", icon: FileText },
  { id: "matrix", title: "Classroom Matrix", icon: FolderArchive },
  { id: "attendance", title: "Attendance Sheets", icon: ClipboardList },
  { id: "duty", title: "Duty Chart", icon: Users },
]

export default function AdminReports({ onLogout, onNavigate }: AdminReportsProps) {
  const [activeSemId, setActiveSemId] = useState<string | null>(null)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)

  const selectedSem = semesters.find(s => s.id === activeSemId)
  const availableSlots = activeSemId ? slotsMap[activeSemId] : []
  const selectedSlot = availableSlots.find(s => s.id === activeSlotId)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* SAME HEADER AS ADMIN PORTAL */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administrator</h1>
              <p className="text-sm text-slate-300 italic">
                SJCET Examination Cell
              </p>
            </div>
          </div>

          <Button
            onClick={onLogout}
            className="bg-red-600 text-black shadow-sm hover:bg-red-800 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">

       {/* BACK BUTTON */}
        <Button
        variant="ghost"
        onClick={() => {
            if (activeSlotId) {
            setActiveSlotId(null)       // Level 3 → Level 2
            } else if (activeSemId) {
            setActiveSemId(null)        // Level 2 → Level 1
            } else {
            onNavigate("admin")         // Level 1 → Admin dashboard
            }
        }}
        className="mb-6 text-gray-600"
        >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
        </Button>

        {!activeSemId ? (
          <>
            <h2 className="text-2xl font-bold mb-6">Select Semester</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {semesters.map(sem => (
                <Card
                  key={sem.id}
                  onClick={() => setActiveSemId(sem.id)}
                  className="cursor-pointer hover:border-blue-500 transition-all"
                >
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold">{sem.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : !activeSlotId ? (
          <>

            <h2 className="text-2xl font-bold mb-6">
              {selectedSem?.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {availableSlots.map(slot => (
                <Card
                  key={slot.id}
                  onClick={() => setActiveSlotId(slot.id)}
                  className="cursor-pointer hover:border-blue-500 transition-all"
                >
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-bold">{slot.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>

            <h2 className="text-2xl font-bold mb-6">
              {selectedSem?.name} • {selectedSlot?.name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportTypes.map(report => (
                <Card key={report.id} className="hover:border-green-500 transition-all">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <report.icon className="w-6 h-6 text-green-600" />
                      <h3 className="font-bold">{report.title}</h3>
                    </div>

                    <Button size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}