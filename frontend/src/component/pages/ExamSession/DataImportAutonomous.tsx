"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight, Trash2, AlertCircle, Settings, Plus, X } from "lucide-react"
import { Input } from "../../ui/input"

// --- INITIAL DATA ---
const INITIAL_DEPARTMENTS: string[] = [
  "Computer Science and Engineering",
  "Artificial Intelligence and Data Science",
  "Civil Engineering",
  "Cyber Security",
  "Computer Science with Artificial Intelligence",
  "Electronics and Communications Engineering",
  "Electronics and Computer Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering"
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8].map((semester) => `S${semester}`)

const INITIAL_SYLLABUS: Record<string, Record<string, { name: string; code: string }[]>> = {
  "S1": {
    "All": [
      { name: "Linear Algebra", code: "MAT 101" },
      { name: "Engineering Physics A", code: "PHT 100" },
      { name: "Engineering Physics B", code: "PHT 110" },
      { name: "Engineering Graphics", code: "EST 110" },
      { name: "Life Skills", code: "HUN 101" },
      { name: "Engineering Chemistry", code: "CYT 100" },
      { name: "Engineering Mechanics", code: "EST 100" },
      { name: "Basics of Civil and Mechanical Engineering", code: "EST 120" },
      { name: "Basics of Electrical and Electronic Engineering", code: "EST 130" }
    ]
  },
  "S2": {
    "All": [
      { name: "Vector Calculus, Differential Equation", code: "MAT 102" },
      { name: "Professional Communication", code: "HUN 102" },
      { name: "Programming in C", code: "EST 102" },
      { name: "Engineering Physics A", code: "PHT 100" },
      { name: "Engineering Physics B", code: "PHT 110" },
      { name: "Engineering Graphics", code: "EST 110" },
      { name: "Engineering Chemistry", code: "CYT 100" },
      { name: "Engineering Mechanics", code: "EST 100" }
    ]
  },
  "S3": {
    "Computer Science and Engineering": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Civil Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Mechanics of Solids", "code": "CET 201" },
      { "name": "Fluid Mechanics and Hydraulics", "code": "CET 203" },
      { "name": "Surveying and Geomatics", "code": "CET 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Cyber Security": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Circuits and Networks", "code": "EET 201" },
      { "name": "Measurements and Instrumentation", "code": "EET 203" },
      { "name": "Analog Electronics", "code": "EET 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Solid State Devices", "code": "ECT 201" },
      { "name": "Logic Circuit Design", "code": "ECT 203" },
      { "name": "Network Theory", "code": "ECT 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Mechanical Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Mechanics of Solids", "code": "MET 201" },
      { "name": "Mechanics of Fluids", "code": "MET 203" },
      { "name": "Metallurgy & Material Science", "code": "MET 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Solid State Devices", "code": "ECT 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ]
  },
  "S4": {
   "Computer Science and Engineering": [
      { "name": "Graph Theory", "code": "MAT 206" },
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Database Management Systems", "code": "CST 204" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Probability, Statistics and Numerical Methods", "code": "MAT 256" },
      { "name": "Introduction to Artificial Intelligence", "code": "ADT 202" },
      { "name": "Data Storage and Management", "code": "ADT 204" },
      { "name": "Machine Learning", "code": "ADT 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Civil Engineering": [
      { "name": "Vector Calculus, Differential Equations and Transforms", "code": "MAT 202" },
      { "name": "Engineering Geology", "code": "CET 202" },
      { "name": "Structural Analysis I", "code": "CET 204" },
      { "name": "Transportation Engineering", "code": "CET 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Cyber Security": [
      { "name": "Probability, Statistics and Numerical Methods", "code": "MAT 256" },
      { "name": "Introduction to Cyber Security", "code": "CZT 202" },
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Probability, Statistics and Numerical Methods", "code": "MAT 256" },
      { "name": "Introduction to AI", "code": "AIT 202" },
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Probability, Distributions and Numerical Methods", "code": "MAT 204" },
      { "name": "Analog Circuits", "code": "ECT 202" },
      { "name": "Signals and Systems", "code": "ECT 204" },
      { "name": "Computer Organization", "code": "ECT 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Analog Circuits", "code": "ECT 202" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Signals and Systems", "code": "ECT 204" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Probability, Distributions and Numerical Methods", "code": "MAT 204" },
      { "name": "DC Machines and Transformers", "code": "EET 202" },
      { "name": "Digital Electronics", "code": "EET 204" },
      { "name": "Power System I", "code": "EET 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Mechanical Engineering": [
      { "name": "Vector Calculus, Differential Equations and Transforms", "code": "MAT 202" },
      { "name": "Engineering Thermodynamics", "code": "MET 202" },
      { "name": "Manufacturing Process", "code": "MET 204" },
      { "name": "Machine Tools and Metrology", "code": "MET 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ]
  },
  "S5": {
  "Computer Science and Engineering": [
      { "name": "Formal Languages and Automata Theory", "code": "CST 301" },
      { "name": "Computer Networks", "code": "CST 303" },
      { "name": "System Software", "code": "CST 305" },
      { "name": "Microprocessors and Microcontrollers", "code": "CST 307" },
      { "name": "Management of Software Systems", "code": "CST 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Civil Engineering": [
      { "name": "Structural Analysis II", "code": "CET 301" },
      { "name": "Design of Concrete Structures I", "code": "CET 303" },
      { "name": "Geotechnical Engineering I", "code": "CET 305" },
      { "name": "Hydrology & Water Resources Engineering", "code": "CET 307" },
      { "name": "Management for Engineers", "code": "CET 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Linear Integrated Circuits", "code": "ECT 301" },
      { "name": "Digital Communication", "code": "ECT 303" },
      { "name": "Electromagnetic Waves", "code": "ECT 305" },
      { "name": "Control Systems", "code": "ECT 307" },
      { "name": "Management for Engineers", "code": "HUT 310" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Power System II", "code": "EET 301" },
      { "name": "Microprocessors and Microcontrollers", "code": "EET 303" },
      { "name": "Signals and Systems", "code": "EET 305" },
      { "name": "Synchronous and Induction Machines", "code": "EET 307" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Mechanical Engineering": [
      { "name": "Mechanics of Machinery", "code": "MET 301" },
      { "name": "Thermal Engineering I", "code": "MET 303" },
      { "name": "Industrial Engineering", "code": "MET 305" },
      { "name": "Design of Machine Elements I", "code": "MET 307" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Foundations of Machine Learning", "code": "ADT 301" },
      { "name": "Database Management Systems", "code": "ADT 303" },
      { "name": "Operating Systems", "code": "ADT 305" },
      { "name": "Programming with Python", "code": "ADT 307" },
      { "name": "Principles of Management", "code": "ADT 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Cyber Security": [
      { "name": "Cryptography", "code": "CZT 301" },
      { "name": "Network Security", "code": "CZT 303" },
      { "name": "Secure Coding", "code": "CZT 305" },
      { "name": "Digital Forensics", "code": "CZT 307" },
      { "name": "Management of Software Systems", "code": "CST 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Machine Learning", "code": "AIT 301" },
      { "name": "Artificial Intelligence", "code": "AIT 303" },
      { "name": "Data Analytics", "code": "AIT 305" },
      { "name": "Neural Networks", "code": "AIT 307" },
      { "name": "Management of Software Systems", "code": "CST 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Database Management Systems", "code": "CST 204" },
      { "name": "Digital Communication", "code": "ECT 303" },
      { "name": "Electromagnetic Waves", "code": "ECT 305" },
      { "name": "Microprocessors and Microcontrollers", "code": "CST 307" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ]
  }
};

interface AutoFileEntry {
  id: string
  file: File
  batch: string
  semester: string
  dept: string
  subjectName: string
  subjectCode: string
}

export function DataImportAutonomous({ onUpload, onBack }: { onUpload: (data: any) => void; onBack: () => void }) {
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [fileEntries, setFileEntries] = useState<AutoFileEntry[]>([])
  
  // --- DYNAMIC DATA MANAGEMENT ---
  const [departments, setDepartments] = useState<string[]>(INITIAL_DEPARTMENTS)
  const [syllabus, setSyllabus] = useState(INITIAL_SYLLABUS)
  const [isManaging, setIsManaging] = useState(false)
  
  // Management Temp States
  const [newDeptName, setNewDeptName] = useState("")
  const [mgmtSem, setMgmtSem] = useState("S3")
  const [mgmtDept, setMgmtDept] = useState(INITIAL_DEPARTMENTS[0])
  const [newSubName, setNewSubName] = useState("")
  const [newSubCode, setNewSubCode] = useState("")

  const processFiles = (files: File[]) => {
    const newEntries: AutoFileEntry[] = files.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      batch: "",
      semester: "",
      dept: "",
      subjectName: "",
      subjectCode: ""
    }))
    setFileEntries(prev => [...prev, ...newEntries])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); 
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => /\.(csv|xlsx|xls)$/i.test(f.name))
    processFiles(dropped)
  }, [])

  const updateTag = (id: string, field: keyof AutoFileEntry, value: string) => {
    setFileEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      const updated = { ...entry, [field]: value };

      if (field === "batch" || field === "semester" || field === "dept") {
        updated.subjectName = "";
        updated.subjectCode = "";
        return updated;
      }
      
      if (field === "subjectName") {
        const semesterData = syllabus[updated.semester];
        const deptData = semesterData?.[updated.dept] || semesterData?.["All"];
        const subject = deptData?.find(s => s.name === value);
        updated.subjectCode = subject ? subject.code : "";
      }
      return updated;
    }))
  }

  const removeFile = (id: string) => setFileEntries(prev => prev.filter(e => e.id !== id))

  const getSubjects = (semester: string, dept: string) => {
    if (!semester) return [];
    const semesterData = syllabus[semester];
    if (!semesterData) return [];
    if (["S1", "S2"].includes(semester)) return semesterData["All"] || [];
    return semesterData[dept] || [];
  };

  // --- MANAGEMENT LOGIC ---
  const addDept = () => {
    if (newDeptName && !departments.includes(newDeptName)) {
      setDepartments([...departments, newDeptName]); setNewDeptName("");
    }
  }
  const deleteDept = (name: string) => setDepartments(departments.filter(d => d !== name))

  const addSubject = () => {
    if (!newSubName || !newSubCode) return;
    setSyllabus(prev => ({
      ...prev,
      [mgmtSem]: {
        ...prev[mgmtSem],
        [mgmtDept]: [...(prev[mgmtSem]?.[mgmtDept] || []), { name: newSubName, code: newSubCode }]
      }
    }));
    setNewSubName(""); setNewSubCode("");
  }

  const handleContinue = () => {
    onUpload({
      type: "autonomous",
      data: fileEntries
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Autonomous University Upload</CardTitle>
          <p className="text-sm text-muted-foreground">Upload and tag departmental course details</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsManaging(!isManaging)}>
          <Settings className={`w-5 h-5 ${isManaging ? "text-primary" : "text-muted-foreground"}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {isManaging ? (
          <div className="space-y-6 border p-4 rounded-lg bg-slate-50/50">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2 uppercase tracking-widest text-slate-500">Manage Branches</h3>
              <div className="flex gap-2">
                <Input placeholder="New Branch Name" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                <Button size="sm" onClick={addDept}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments.map(d => (
                  <span key={d} className="flex items-center gap-1 bg-white border px-2 py-1 rounded text-xs font-bold">
                    {d} <X className="w-3 h-3 cursor-pointer text-destructive" onClick={() => deleteDept(d)} />
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2 uppercase tracking-widest text-slate-500">Manage Courses</h3>
              <div className="grid grid-cols-2 gap-2">
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={mgmtSem} onChange={e => setMgmtSem(e.target.value)}>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={mgmtDept} onChange={e => setMgmtDept(e.target.value)}>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Subject Name" value={newSubName} onChange={e => setNewSubName(e.target.value)} />
                <Input placeholder="Code" value={newSubCode} onChange={e => setNewSubCode(e.target.value)} className="w-24" />
                <Button size="sm" onClick={addSubject}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {(syllabus[mgmtSem]?.[mgmtDept] || []).map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 border rounded">
                    <span className="font-bold">{s.name} ({s.code})</span>
                    <Trash2 className="w-3 h-3 text-destructive cursor-pointer" onClick={() => {
                        setSyllabus(prev => ({
                          ...prev,
                          [mgmtSem]: { ...prev[mgmtSem], [mgmtDept]: prev[mgmtSem][mgmtDept].filter((_, i) => i !== idx)}
                        }))
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* DROPZONE */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center shadow-sm">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-lg">Upload Student Data</p>
                  <p className="text-sm text-muted-foreground">Drag and drop your files here, or click to browse</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept=".csv,.xlsx,.xls" 
                  className="hidden" 
                  id="auto-file-input" 
                  onChange={(e) => processFiles(Array.from(e.target.files || []))} 
                />
                <label htmlFor="auto-file-input">
                  <Button variant="outline" asChild className="cursor-pointer font-bold px-8">
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
            </div>

            {/* SCROLLABLE ENTRIES */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {fileEntries.map((entry) => {
                const subjects = getSubjects(entry.semester, entry.dept);
                return (
                  <div key={entry.id} className="p-5 border rounded-xl bg-white shadow-sm space-y-4 border-slate-100">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-50">
                      <div className="flex items-center gap-3 text-blue-600">
                        <div className="p-2 bg-blue-50 rounded-lg"><FileSpreadsheet className="w-4 h-4" /></div>
                        <span className="text-sm font-black truncate max-w-md uppercase tracking-tight">{entry.file.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(entry.id)} className="hover:bg-red-50 group">
                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Batch</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none" value={entry.batch} onChange={e => updateTag(entry.id, "batch", e.target.value)}>
                          <option value="">Select Batch</option>
                          <option value="autonomous">Autonomous</option>
                          <option value="ktu">KTU</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none" value={entry.semester} onChange={e => updateTag(entry.id, "semester", e.target.value)} disabled={!entry.batch}>
                          <option value="">Select Semester</option>
                          {SEMESTERS.map(s => <option key={s} value={s}>Semester {s.slice(1)}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none" value={entry.dept} onChange={e => updateTag(entry.id, "dept", e.target.value)} disabled={!entry.batch || !entry.semester}>
                          <option value="">Select Branch</option>
                          {departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject Title</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none" value={entry.subjectName} onChange={e => updateTag(entry.id, "subjectName", e.target.value)} disabled={!entry.batch || !entry.semester || !entry.dept || !subjects.length}>
                          <option value="">Select Subject</option>
                          {subjects.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Course Code</label>
                        <Input placeholder="Code" value={entry.subjectCode} readOnly className="bg-slate-50 border-slate-200 font-black text-blue-700 text-xs h-10" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {fileEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                   <AlertCircle className="w-10 h-10 mb-2" />
                   <p className="font-black uppercase tracking-[0.2em] text-xs">No entries generated</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="ghost" onClick={onBack} className="font-black uppercase text-[11px] tracking-widest text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <Button 
            disabled={fileEntries.length === 0 || fileEntries.some(e => !e.subjectCode) || isManaging} 
            onClick={handleContinue}
            className="bg-blue-700 hover:bg-blue-800 text-white font-black uppercase text-[11px] tracking-widest px-10 h-12 shadow-xl shadow-blue-100"
          >
            Preview Results
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}