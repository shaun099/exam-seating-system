import React, { useState } from "react"
import {
  Download,
  FileText,
  FolderArchive,
  ClipboardList,
  Users,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
// --- DATA ---
const semesters = [
  { id: "s1", name: "Semester 1" },
  { id: "s3", name: "Semester 3" },
  { id: "s5", name: "Semester 5" },
];

const slotsMap: Record<string, { id: string; name: string }[]> = {
  s1: [{ id: "s1a", name: "Slot A" }, { id: "s1b", name: "Slot B" }],
  s3: [{ id: "s3a", name: "Slot A" }, { id: "s3b", name: "Slot B" }, { id: "s3c", name: "Slot C" }],
  s5: [{ id: "s5a", name: "Slot A" }, { id: "s5b", name: "Slot B" }, { id: "s5c", name: "Slot C" }, { id: "s5d", name: "Slot D" }],
};

const reportTypes = [
  { 
    id: "seating", 
    title: "Consolidated Seating", 
    description: "Complete seating arrangement for all rooms",
    icon: FileText, 
    color: "text-blue-600 bg-blue-50" 
  },
  { 
    id: "matrix", 
    title: "Classroom Matrix", 
    description: "Individual seating matrices for each classroom",
    icon: FolderArchive, 
    color: "text-amber-600 bg-amber-50" 
  },
  { 
    id: "attendance", 
    title: "Attendance Sheets", 
    description: "Pre-formatted attendance sheets for invigilators",
    icon: ClipboardList, 
    color: "text-emerald-600 bg-emerald-50" 
  },
  { 
    id: "duty", 
    title: "Duty Chart", 
    description: "Invigilator duty assignments by room and slot",
    icon: Users, 
    color: "text-purple-600 bg-purple-50" 
  },
];

const recentReports = [
  { semId: "s5", slotId: "s5a", semName: "Semester 5", slotName: "Slot A", generatedAt: "2 hours ago" },
  { semId: "s3", slotId: "s3b", semName: "Semester 3", slotName: "Slot B", generatedAt: "1 day ago" },
];

const Reports: React.FC = () => {
  const [activeSemId, setActiveSemId] = useState<string | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  const selectedSem = semesters.find(s => s.id === activeSemId);
  const availableSlots = activeSemId ? slotsMap[activeSemId] : [];
  const selectedSlot = availableSlots.find(sl => sl.id === activeSlotId);

  return (
    <div className="fixed top-16 left-64 right-0 bottom-0 overflow-hidden bg-[#fafafa] text-slate-900 antialiased font-sans flex flex-col">
      {/* NAVIGATION TABS */}
      <header className="h-14 bg-white backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-1">
            <button 
              onClick={() => { setActiveSemId(null); setActiveSlotId(null); }}
              className={cn(
                "px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all",
                !activeSemId ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Overview
            </button>
            {semesters.map((sem) => (
              <button
                key={sem.id}
                onClick={() => { setActiveSemId(sem.id); setActiveSlotId(null); }}
                className={cn(
                  "px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all",
                  activeSemId === sem.id ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {sem.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-auto max-w-6xl mx-auto px-8 py-12 w-full">
        {!activeSemId ? (
          /* HOME PAGE: RECENT DOWNLOADS */
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex flex-col gap-1 mb-6">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Downloads</h3>
                <h2 className="text-2xl font-bold text-slate-800">Latest Generated Reports</h2>
            </div>
            
            <div className="space-y-6">
              {recentReports.map((report, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-800">{report.semName} • {report.slotName}</h2>
                      <p className="text-sm text-slate-500 font-medium">Generated {report.generatedAt}</p>
                    </div>
                    <button 
                      onClick={() => { setActiveSemId(report.semId); setActiveSlotId(report.slotId); }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      View All <ChevronRight size={16} />
                    </button>
                  </div>
              
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {reportTypes.map((rpt, idx) => (
                      <div key={rpt.id} className={cn(
                        "p-8 group hover:bg-slate-50 transition-colors border-slate-100",
                        idx !== 3 && "lg:border-r",
                        idx < 2 && "border-b sm:border-b-0",
                        idx === 1 && "lg:border-b-0"
                      )}>
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", rpt.color)}>
                          <rpt.icon size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-tight mb-2">{rpt.title}</p>
                        <p className="text-xs text-slate-400 font-medium mb-6 line-clamp-2 leading-relaxed">{rpt.description}</p>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all uppercase tracking-wider">
                          <Download size={14} /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !activeSlotId ? (
          /* SLOT SELECTION */
          <div className="animate-in fade-in duration-500">
            <button 
              onClick={() => setActiveSemId(null)} 
              className="group flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors mb-8"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Overview
            </button>
            <h2 className="text-4xl font-bold tracking-tight mb-8 text-slate-800">{selectedSem?.name}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {availableSlots.map(slot => (
                <button 
                  key={slot.id}
                  onClick={() => setActiveSlotId(slot.id)}
                  className="p-8 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-600 hover:ring-1 hover:ring-blue-600 transition-all group shadow-sm"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Session</span>
                  <h4 className="text-2xl font-bold mt-1 tracking-tight text-slate-800">{slot.name}</h4>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* FINAL REPORTS LIST */
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
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map(report => (
                <div key={report.id} className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-[1.5rem] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", report.color)}>
                      <report.icon size={26} />
                    </div>
                    <div>
                        <span className="text-[16px] font-bold text-slate-800 tracking-tight block mb-0.5">{report.title}</span>
                        <p className="text-xs text-slate-400 font-medium">{report.description}</p>
                    </div>
                  </div>
                  <button className="p-3.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;