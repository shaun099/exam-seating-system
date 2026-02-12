"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  CheckCircle2,
  Clock,
  Upload,
  Play,
  FileText,
} from "lucide-react"

interface Slot {
  id: string
  name: string
  status: "pending" | "in-progress" | "completed"
}

interface Semester {
  id: string
  name: string
  slots: Slot[]
}

const semesters: Semester[] = [
  {
    id: "s2",
    name: "S2",
    slots: [
      { id: "s2-a", name: "Slot A", status: "completed" },
      { id: "s2-b", name: "Slot B", status: "completed" },
    ],
  },
  {
    id: "s4",
    name: "S4",
    slots: [
      { id: "s4-a", name: "Slot A", status: "in-progress" },
      { id: "s4-b", name: "Slot B", status: "pending" },
    ],
  },
  {
    id: "s6",
    name: "S6",
    slots: [
      { id: "s6-a", name: "Slot A", status: "pending" },
      { id: "s6-b", name: "Slot B", status: "pending" },
    ],
  },
]

type ModalState = "none" | "room-config" | "progress" | "invigilator"

export function SeatingAllocation() {
  const [activeModal, setActiveModal] = useState<ModalState>("none")
  const [roomOption, setRoomOption] = useState("default")
  const [invigilatorOption, setInvigilatorOption] = useState("default")
  const [progress, setProgress] = useState(0)
  const [progressLogs, setProgressLogs] = useState<string[]>([])
  const [, setSelectedSlot] = useState<string | null>(null)

  const handleSlotClick = (slotId: string, status: string) => {
    if (status === "completed") return
    setSelectedSlot(slotId)
    setActiveModal("room-config")
  }

  const handleContinueAllocation = () => {
    setActiveModal("progress")
    setProgress(0)
    setProgressLogs([])
  }

  useEffect(() => {
    if (activeModal === "progress") {
      const logs = [
        "Initializing allocation process...",
        "Processing Slot A students...",
        "Assigning CS students to Room 201...",
        "Assigning EC students to Room 202...",
        "Assigning ME students to Room 203...",
        "Applying department interleaving...",
        "Verifying seat assignments...",
        "Generating seating matrix...",
        "Allocation completed successfully!",
      ]

      let currentLog = 0
      const interval = setInterval(() => {
        if (currentLog < logs.length) {
          setProgressLogs((prev) => [...prev, logs[currentLog]])
          setProgress(((currentLog + 1) / logs.length) * 100)
          currentLog++
        } else {
          clearInterval(interval)
          setTimeout(() => {
            setActiveModal("invigilator")
          }, 1000)
        }
      }, 500)

      return () => clearInterval(interval)
    }
  }, [activeModal])

  const handleGenerateReport = () => {
    setActiveModal("none")
    setSelectedSlot(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "in-progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Seating Allocation</h1>
          <p className="text-muted-foreground">Manage seating allocation for exam slots</p>
        </div>
        <Button variant="outline">
          <Building2 className="w-4 h-4 mr-2" />
          Manage Rooms
        </Button>
      </div>

      {/* Semester Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {semesters.map((semester) => (
          <Card key={semester.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">Semester {semester.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {semester.slots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id, slot.status)}
                  className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
                    slot.status === "completed"
                      ? "bg-emerald-50 border-emerald-200 cursor-default"
                      : "bg-card hover:bg-muted cursor-pointer"
                  }`}
                >
                  <span className="font-medium text-foreground">{slot.name}</span>
                  {getStatusBadge(slot.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Configuration Modal */}
      <Dialog open={activeModal === "room-config"} onOpenChange={() => setActiveModal("none")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Room Configuration</DialogTitle>
            <DialogDescription>
              Do you want to use the Default Seating Plan?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={roomOption} onValueChange={setRoomOption}>
              <div className="flex items-start space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted">
                <RadioGroupItem value="default" id="default" />
                <div className="flex-1">
                  <Label htmlFor="default" className="cursor-pointer font-medium">
                    Use Default List
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    30 Rooms Available - Pre-configured seating plan
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted">
                <RadioGroupItem value="custom" id="custom" />
                <div className="flex-1">
                  <Label htmlFor="custom" className="cursor-pointer font-medium">
                    Create New Plan
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a custom room configuration CSV
                  </p>
                  {roomOption === "custom" && (
                    <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Room CSV
                    </Button>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleContinueAllocation}>
              <Play className="w-4 h-4 mr-2" />
              Continue Allocation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocation Progress Modal */}
      <Dialog open={activeModal === "progress"} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {progress === 100 ? "Allocation Complete!" : "Allocating Students..."}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-sm space-y-1">
              {progressLogs.map((log, index) => (
                <div key={`log-${index}`} className="flex items-center gap-2">
                  {progress === 100 && index === progressLogs.length - 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-muted-foreground flex-shrink-0">
                      &gt;
                    </span>
                  )}
                  <span className={index === progressLogs.length - 1 && progress === 100 ? "text-emerald-600" : "text-foreground"}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invigilator Assignment Modal */}
      <Dialog open={activeModal === "invigilator"} onOpenChange={() => setActiveModal("none")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Invigilators</DialogTitle>
            <DialogDescription>
              Select Duty List Source for invigilator assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={invigilatorOption} onValueChange={setInvigilatorOption}>
              <div className="flex items-start space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted">
                <RadioGroupItem value="default" id="inv-default" />
                <div className="flex-1">
                  <Label htmlFor="inv-default" className="cursor-pointer font-medium">
                    Use Default Faculty List
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    45 Faculty members available
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted">
                <RadioGroupItem value="custom" id="inv-custom" />
                <div className="flex-1">
                  <Label htmlFor="inv-custom" className="cursor-pointer font-medium">
                    Upload New Duty List
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a custom duty list CSV
                  </p>
                  {invigilatorOption === "custom" && (
                    <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Duty CSV
                    </Button>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleGenerateReport} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Generate Final Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
