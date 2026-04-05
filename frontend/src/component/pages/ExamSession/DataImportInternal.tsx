"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import {
  Upload, FileSpreadsheet, ArrowLeft, ArrowRight,
  Trash2, Settings, Plus, ChevronDown, Loader2, AlertCircle,
} from "lucide-react"
import { Input } from "../../ui/input"
import * as XLSX from "xlsx"

// ------------------------------------------------------------------ //
//  Constants & helpers                                                 //
// ------------------------------------------------------------------ //

const DEPT_PATTERNS = [
  { pattern: /\bCSE\b|computer science/i,           dept: "Computer Science and Engineering" },
  { pattern: /\bAD\b|artificial intelligence/i,     dept: "Artificial Intelligence and Data Science" },
  { pattern: /\bCivil\b|\bCE\b/i,                   dept: "Civil Engineering" },
  { pattern: /\bCC\b|cyber security/i,               dept: "Cyber Security" },
  { pattern: /\bCA\b|computer science.*artificial/i, dept: "Computer Science with Artificial Intelligence" },
  { pattern: /\bECE\b|electronics.*communications/i, dept: "Electronics and Communications Engineering" },
  { pattern: /\bER\b|electronics.*computer/i,        dept: "Electronics and Computer Engineering" },
  { pattern: /\bEEE\b|electrical/i,                  dept: "Electrical and Electronics Engineering" },
  { pattern: /\bME\b|mechanical/i,                   dept: "Mechanical Engineering" },
]

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => `S${s}`)
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"]
const ALLOWED_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]

const getDeptFromText = (text: string, fallback = "") =>
  DEPT_PATTERNS.find((p) => p.pattern.test(text))?.dept ?? fallback

const parseBatchLine = (
  text: string,
  defaults: { dept: string; semester: string; division: string }
) => {
  const semesterMatch = text.match(/\bS([1-8])\b/i)
  const semester = semesterMatch ? `S${semesterMatch[1]}` : defaults.semester

  const divisionMatch =
    text.match(/division\s*[:.-]?\s*([A-Z]\d?)/i) ||
    text.match(/\b([A-Z]\d?)\b\s*\(\s*S[1-8]\s*\)/i) ||
    text.match(/\bS[1-8]\b\s*[-:/]\s*([A-Z]\d?)\b/i)
  const division = divisionMatch ? divisionMatch[1].toUpperCase() : defaults.division

  const dept = getDeptFromText(text, defaults.dept)
  return { dept, semester, division }
}

const isValidFile = (file: File) => {
  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME.includes(file.type)
}

// ------------------------------------------------------------------ //
//  Types                                                               //
// ------------------------------------------------------------------ //

interface Subject {
  course_name: string
  course_code: string
}

interface Syllabus {
  [semester: string]: {
    [department: string]: Subject[]
  }
}

interface FileEntry {
  id: string
  file: File
  dept: string
  semester: string
  division: string
  batch: string
  subjectName: string
  subjectCode: string
  studentCount: number
  startRow: number
  endRow: number
}

// Per-dept add-form state, keyed by `${sem}__${dept}`
type AddFormState = Record<string, { name: string; code: string }>

// ------------------------------------------------------------------ //
//  Component                                                           //
// ------------------------------------------------------------------ //

export function DataImportInternal({
  onUpload,
  onBack,
}: {
  onUpload: (data: any) => void
  onBack: () => void
}) {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [isManaging, setIsManaging] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // FIX #7 — surface backend errors in the UI
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [syllabus, setSyllabus] = useState<Syllabus>({})
  const [departments, setDepartments] = useState<string[]>([])
  const [expandedSem, setExpandedSem] = useState<string | null>(null)
  // FIX #1 — isolated add-form state per semester+department key
  const [addForms, setAddForms] = useState<AddFormState>({})

  // ---------------------------------------------------------------- //
  //  Backend fetch                                                     //
  // ---------------------------------------------------------------- //

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const res = await fetch("http://localhost:8000/api/v1/exams/subjects")
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data: any[] = await res.json()

      // FIX #6 — deduplicate departments from backend
      const uniqueDepts = Array.from(
        new Set(data.map((s) => (s.department ?? "").trim()).filter(Boolean))
      ) as string[]
      setDepartments(uniqueDepts)

      const grouped = data.reduce<Syllabus>((acc, sub) => {
        const sem = (sub.semester ?? "").trim()
        const dept = (sub.department ?? "").trim()
        if (!sem || !dept) return acc
        if (!acc[sem]) acc[sem] = {}
        if (!acc[sem][dept]) acc[sem][dept] = []
        acc[sem][dept].push({ course_name: sub.course_name, course_code: sub.course_code })
        return acc
      }, {})

      setSyllabus(grouped)
    } catch (e: any) {
      // FIX #7 — show visible error instead of silent console.error
      setFetchError(e.message ?? "Could not connect to server")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ---------------------------------------------------------------- //
  //  Subject lookup                                                    //
  // ---------------------------------------------------------------- //

  const getSubjectsFor = (semester: string, dept: string): Subject[] => {
    const semData = syllabus[semester] ?? {}

    // Exact match first
    if (semData[dept]) return semData[dept]

    // Case-insensitive fallback
    const matchedKey = Object.keys(semData).find(
      (key) => key.trim().toLowerCase() === dept.trim().toLowerCase()
    )
    if (matchedKey) return semData[matchedKey]

    // FIX #4 — removed "All" catch-all; return empty so UI shows "no subjects"
    return []
  }

  // ---------------------------------------------------------------- //
  //  Syllabus management actions                                       //
  // ---------------------------------------------------------------- //

  const handleAdd = async (sem: string, dept: string) => {
    const key = `${sem}__${dept}`
    const form = addForms[key] ?? { name: "", code: "" }
    if (!form.name.trim() || !form.code.trim()) return

    await fetch("http://localhost:8000/api/v1/exams/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semester: sem,
        department: dept,
        batch: "KTU",
        course_name: form.name.trim(),
        course_code: form.code.trim().toUpperCase(),
      }),
    })

    // Clear only this form's state
    setAddForms((prev) => ({ ...prev, [key]: { name: "", code: "" } }))
    loadData()
  }

  // FIX #2 — confirmation before delete
  const handleDelete = async (courseCode: string, courseName: string) => {
    if (!window.confirm(`Delete "${courseName}" (${courseCode})?`)) return

    const res = await fetch(
      `http://localhost:8000/api/v1/exams/subjects/${courseCode}`,
      { method: "DELETE" }
    )
    // FIX #10 — server now returns 404 for missing codes; surface it here
    if (!res.ok && res.status === 404) {
      alert(`Subject "${courseCode}" was not found on the server.`)
      return
    }
    loadData()
  }

  // ---------------------------------------------------------------- //
  //  File processing                                                   //
  // ---------------------------------------------------------------- //

  const processFiles = async (files: File[]) => {
    // FIX #8 — reject unsupported files before passing to XLSX.read
    const validFiles = files.filter(isValidFile)
    const rejected = files.length - validFiles.length
    if (rejected > 0) {
      alert(`${rejected} file(s) skipped — only .csv, .xlsx and .xls files are accepted.`)
    }
    if (validFiles.length === 0) return

    const newEntries: FileEntry[] = []

    for (const f of validFiles) {
      // FIX #3 — skip exact duplicate files already in the list
      const alreadyAdded = fileEntries.some(
        (e) => e.file.name === f.name && e.file.size === f.size
      )
      if (alreadyAdded) continue

      const rows: any[][] = await new Promise((res) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const wb = XLSX.read(e.target?.result, { type: "array" })
          res(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }))
        }
        reader.readAsArrayBuffer(f)
      })

      const headerText = rows
        .slice(0, 80)
        .map((row) => (row ?? []).join(" "))
        .join(" ")

      const globalDept = getDeptFromText(headerText, "")
      const globalSemMatch = headerText.match(/\bS([1-8])\b/i)
      const globalSemester = globalSemMatch ? `S${globalSemMatch[1]}` : ""
      const globalDivMatch =
        headerText.match(/division\s*[:.-]?\s*([A-Z]\d?)/i) ||
        headerText.match(/\b([A-Z]\d?)\b\s*\(\s*S[1-8]\s*\)/i)
      const globalDivision = globalDivMatch ? globalDivMatch[1].toUpperCase() : "NA"

      const blocks: { start: number; dept: string; sem: string; div: string }[] = []
      rows.forEach((row, idx) => {
        const txt = (row ?? []).join(" ")
        if (/batch\s*:/i.test(txt)) {
          const parsed = parseBatchLine(txt, {
            dept: globalDept,
            semester: globalSemester,
            division: globalDivision,
          })
          blocks.push({ start: idx, dept: parsed.dept, sem: parsed.semester, div: parsed.division })
        }
      })

      const perFileEntries: FileEntry[] = []

      if (blocks.length === 0) {
        perFileEntries.push({
          id: Math.random().toString(36).substr(2, 9),
          file: f,
          dept: globalDept,
          semester: globalSemester,
          division: globalDivision,
          batch: "KTU",
          subjectName: "",
          subjectCode: "",
          studentCount: rows.length,
          startRow: 0,
          endRow: rows.length,
        })
      } else {
        blocks.forEach((meta, i) => {
          const end = blocks[i + 1]?.start ?? rows.length
          const count = rows
            .slice(meta.start + 1, end)
            .filter((r) => (r ?? []).some((cell: any) => String(cell ?? "").trim() !== ""))
            .length
          perFileEntries.push({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            dept: meta.dept,
            semester: meta.sem,
            division: meta.div,
            batch: "KTU",
            subjectName: "",
            subjectCode: "",
            studentCount: count,
            startRow: meta.start,
            endRow: end,
          })
        })
      }

      // Merge repeated departments within one file into a single card
      const groupedByDept = perFileEntries.reduce<Record<string, FileEntry>>((acc, entry) => {
        const deptKey = entry.dept || "Unknown Department"
        if (!acc[deptKey]) {
          acc[deptKey] = { ...entry }
        } else {
          acc[deptKey].studentCount += entry.studentCount
          acc[deptKey].startRow = Math.min(acc[deptKey].startRow, entry.startRow)
          acc[deptKey].endRow = Math.max(acc[deptKey].endRow, entry.endRow)
          if (!acc[deptKey].semester && entry.semester) acc[deptKey].semester = entry.semester
          if ((!acc[deptKey].division || acc[deptKey].division === "NA") && entry.division) {
            acc[deptKey].division = entry.division
          } else if (
            entry.division &&
            acc[deptKey].division &&
            acc[deptKey].division !== "NA" &&
            entry.division !== "NA" &&
            acc[deptKey].division !== entry.division
          ) {
            acc[deptKey].division = "Mixed"
          }
        }
        return acc
      }, {})

      newEntries.push(...Object.values(groupedByDept))
    }

    // FIX #6 — merge newly detected departments without duplicates
    const detectedDepts = newEntries.map((e) => e.dept).filter(Boolean)
    if (detectedDepts.length) {
      setDepartments((prev) => Array.from(new Set([...prev, ...detectedDepts])))
    }

    setFileEntries((prev) => [...prev, ...newEntries])
  }

  // ---------------------------------------------------------------- //
  //  Tag card updates                                                  //
  // ---------------------------------------------------------------- //

  const updateTag = (id: string, field: string, value: string) => {
    setFileEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        const updated = { ...e, [field]: value }
        if (field === "subjectName") {
          const sub = getSubjectsFor(updated.semester, updated.dept).find(
            (s) => s.course_name === value
          )
          updated.subjectCode = sub ? sub.course_code : ""
        }
        return updated
      })
    )
  }

  // ---------------------------------------------------------------- //
  //  Validation                                                        //
  // ---------------------------------------------------------------- //

  // FIX #5 — per-card validation messages so users know exactly what's missing
  const getMissingField = (entry: FileEntry): string | null => {
    if (!entry.semester) return "Semester"
    if (!entry.dept) return "Branch"
    if (!entry.subjectCode) return "Subject"
    return null
  }

  const allValid = fileEntries.length > 0 && fileEntries.every((e) => !getMissingField(e))

  // ---------------------------------------------------------------- //
  //  Render                                                            //
  // ---------------------------------------------------------------- //

  if (isLoading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading subjects…</p>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-xl font-bold">Internal Import</CardTitle>
          <p className="text-sm text-muted-foreground">Internal examination data uploading platform</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsManaging(!isManaging)}>
          <Settings className={`w-5 h-5 ${isManaging ? "text-primary" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">

        {/* FIX #7 — visible error banner */}
        {fetchError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not load subjects: {fetchError}</span>
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={loadData}>
              Retry
            </Button>
          </div>
        )}

        {!isManaging ? (
          <>
            {/* Drop zone */}
            <div
              onDrop={(e) => { e.preventDefault(); processFiles(Array.from(e.dataTransfer.files)) }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-xl p-10 text-center hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Upload className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop student lists here</p>
              <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx and .xls</p>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="f-in"
                onChange={(e) => processFiles(Array.from(e.target.files ?? []))}
              />
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <label htmlFor="f-in">Browse</label>
              </Button>
            </div>

            {/* File entry cards */}
            <div className="space-y-3">
              {fileEntries.map((entry) => {
                const missingField = getMissingField(entry)
                return (
                  <div
                    key={entry.id}
                    className={`p-4 border rounded-xl bg-white shadow-sm transition-colors ${
                      missingField ? "border-amber-300" : "hover:border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between mb-3 items-center">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold truncate max-w-[200px]">{entry.file.name}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase">
                          {entry.studentCount} Students
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFileEntries((prev) => prev.filter((f) => f.id !== entry.id))}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      <select
                        className="h-9 border rounded-md text-[11px] px-2"
                        value={entry.batch}
                        onChange={(e) => updateTag(entry.id, "batch", e.target.value)}
                      >
                        <option value="KTU">KTU</option>
                        <option value="Autonomous">Autonomous</option>
                      </select>

                      <select
                        className={`h-9 border rounded-md text-[11px] px-2 ${!entry.semester ? "border-amber-400" : ""}`}
                        value={entry.semester}
                        onChange={(e) => updateTag(entry.id, "semester", e.target.value)}
                      >
                        <option value="">Sem</option>
                        {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <select
                        className={`h-9 border rounded-md text-[11px] px-2 ${!entry.dept ? "border-amber-400" : ""}`}
                        value={entry.dept}
                        onChange={(e) => updateTag(entry.id, "dept", e.target.value)}
                      >
                        <option value="">Branch</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>

                      <select
                        className="h-9 border rounded-md text-[11px] px-2"
                        value={entry.division}
                        onChange={(e) => updateTag(entry.id, "division", e.target.value)}
                      >
                        <option value="NA">NA</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="Mixed">Mixed</option>
                      </select>

                      <select
                        className={`h-9 border rounded-md text-[11px] px-2 font-medium ${!entry.subjectCode ? "border-amber-400" : ""}`}
                        value={entry.subjectName}
                        onChange={(e) => updateTag(entry.id, "subjectName", e.target.value)}
                        disabled={!entry.semester || !entry.dept}
                      >
                        <option value="">
                          {!entry.semester || !entry.dept
                            ? "Select sem & branch first"
                            : getSubjectsFor(entry.semester, entry.dept).length === 0
                            ? "No subjects found"
                            : "Subject"}
                        </option>
                        {getSubjectsFor(entry.semester, entry.dept).map((s) => (
                          <option key={s.course_code} value={s.course_name}>
                            {s.course_name}
                          </option>
                        ))}
                      </select>

                      <Input
                        value={entry.subjectCode}
                        readOnly
                        placeholder="Code"
                        className="h-9 text-[11px] bg-slate-50 font-bold"
                      />
                    </div>

                    {/* FIX #5 — inline validation message per card */}
                    {missingField && (
                      <p className="mt-2 text-[10px] text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Please select a {missingField}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* ---- Syllabus manager ---- */
          <div className="space-y-4">
            <p className="text-sm font-bold px-1">Manage Syllabus</p>
            {SEMESTERS.map((sem) => (
              <div key={sem} className="border rounded-lg overflow-hidden">
                <div
                  className="bg-slate-50 p-3 flex justify-between cursor-pointer hover:bg-slate-100"
                  onClick={() => setExpandedSem(expandedSem === sem ? null : sem)}
                >
                  <span className="text-xs font-bold">{sem} Courses</span>
                  <ChevronDown className="w-4 h-4" />
                </div>

                {expandedSem === sem && (
                  <div className="p-3 space-y-4 bg-white animate-in slide-in-from-top-2">
                    {[...departments, "All"].map((dept) => {
                      // FIX #1 — isolated form state per semester+dept
                      const key = `${sem}__${dept}`
                      const form = addForms[key] ?? { name: "", code: "" }

                      return (
                        <div
                          key={dept}
                          className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-50/50 rounded-r-lg"
                        >
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
                            {dept}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                            {(syllabus[sem]?.[dept] ?? []).map((s) => (
                              <div
                                key={s.course_code}
                                className="flex items-center justify-between bg-white p-2 rounded-md border shadow-sm text-[10px]"
                              >
                                <span className="font-bold">
                                  {s.course_name}{" "}
                                  <span className="text-slate-400">({s.course_code})</span>
                                </span>
                                {/* FIX #2 — confirmation built into handleDelete */}
                                <Trash2
                                  className="w-3 h-3 text-destructive cursor-pointer hover:scale-125 transition-transform"
                                  onClick={() => handleDelete(s.course_code, s.course_name)}
                                />
                              </div>
                            ))}

                            {(syllabus[sem]?.[dept] ?? []).length === 0 && (
                              <p className="text-[10px] text-slate-400 col-span-2">No subjects yet</p>
                            )}
                          </div>

                          {/* FIX #1 — each row has its own isolated inputs */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Subject Name"
                              className="h-8 text-[11px]"
                              value={form.name}
                              onChange={(e) =>
                                setAddForms((prev) => ({
                                  ...prev,
                                  [key]: { ...form, name: e.target.value },
                                }))
                              }
                            />
                            <Input
                              placeholder="Code"
                              className="h-8 text-[11px] w-32"
                              value={form.code}
                              onChange={(e) =>
                                setAddForms((prev) => ({
                                  ...prev,
                                  [key]: { ...form, code: e.target.value },
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              className="h-8 px-4"
                              disabled={!form.name.trim() || !form.code.trim()}
                              onClick={() => handleAdd(sem, dept)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-6 border-t mt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-10 px-6 font-black uppercase text-[10px] tracking-[0.2em]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {/* FIX #5 — tooltip on disabled state so users know why it's grayed */}
          <div className="relative group">
            <Button
              disabled={!allValid}
              onClick={() =>
                onUpload({
                  type: "internal",
                  data: fileEntries.map((e) => ({
                    file: e.file,
                    tags: {
                      file_name: e.file.name,
                      batch: e.batch,
                      semester: e.semester,
                      department: e.dept,
                      course_code: e.subjectCode,
                      division: e.division,
                      student_count: e.studentCount,
                      startRow: e.startRow,
                      endRow: e.endRow,
                    },
                  })),
                })
              }
              className="bg-blue-700 hover:bg-blue-800 text-white font-black h-10 px-8 text-[10px] tracking-widest uppercase"
            >
              Preview Data <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {!allValid && fileEntries.length > 0 && (
              <div className="absolute bottom-full right-0 mb-2 w-52 rounded-md bg-slate-800 px-3 py-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Complete all highlighted fields before continuing
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
