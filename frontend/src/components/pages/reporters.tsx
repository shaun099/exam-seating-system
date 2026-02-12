"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  FileText,
  FolderArchive,
  ClipboardList,
  Users,
  CheckCircle2,
} from "lucide-react"

const pastSessions = [
  { id: "SES001", name: "Internal Exam - Jan 2024", date: "Jan 15, 2024", status: "completed" },
  { id: "SES002", name: "University Exam - Dec 2023", date: "Dec 10, 2023", status: "completed" },
  { id: "SES003", name: "Internal Exam - Oct 2023", date: "Oct 20, 2023", status: "completed" },
  { id: "SES004", name: "University Exam - May 2023", date: "May 5, 2023", status: "completed" },
]

const downloadCards = [
  {
    id: "seating",
    title: "Consolidated Seating",
    description: "Complete seating arrangement for all rooms",
    icon: FileText,
    format: "PDF",
    color: "blue",
  },
  {
    id: "matrix",
    title: "Class-wise Matrix",
    description: "Individual seating matrices for each classroom",
    icon: FolderArchive,
    format: "ZIP",
    color: "amber",
  },
  {
    id: "attendance",
    title: "Attendance Sheets",
    description: "Pre-formatted attendance sheets for invigilators",
    icon: ClipboardList,
    format: "PDF",
    color: "emerald",
  },
  {
    id: "duty",
    title: "Duty Chart",
    description: "Invigilator duty assignments by room and slot",
    icon: Users,
    format: "PDF",
    color: "violet",
  },
]

export function Reports() {
  const [activeTab, setActiveTab] = useState("current")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Download and manage examination reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Current Session</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6 mt-6">
          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Completion</span>
                <span className="font-medium text-foreground">75%</span>
              </div>
              <Progress value={75} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">6</p>
                  <p className="text-xs text-muted-foreground">Slots Completed</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">2</p>
                  <p className="text-xs text-muted-foreground">Slots Pending</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">1,245</p>
                  <p className="text-xs text-muted-foreground">Students Allocated</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">28</p>
                  <p className="text-xs text-muted-foreground">Rooms Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Cards */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Download Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {downloadCards.map((card) => {
                const Icon = card.icon
                const bgColor =
                  card.color === "blue"
                    ? "bg-blue-100"
                    : card.color === "amber"
                      ? "bg-amber-100"
                      : card.color === "emerald"
                        ? "bg-emerald-100"
                        : "bg-violet-100"
                const textColor =
                  card.color === "blue"
                    ? "text-blue-600"
                    : card.color === "amber"
                      ? "text-amber-600"
                      : card.color === "emerald"
                        ? "text-emerald-600"
                        : "text-violet-600"

                return (
                  <Card key={card.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${textColor}`} />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{card.format}</Badge>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.id}</TableCell>
                      <TableCell>{session.name}</TableCell>
                      <TableCell className="text-muted-foreground">{session.date}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download All
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
