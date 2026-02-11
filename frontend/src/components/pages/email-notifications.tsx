"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RotateCcw,
  Mail,
  Smartphone,
} from "lucide-react"

const variableChips = [
  { label: "{Student_Name}", description: "Student full name" },
  { label: "{Room_No}", description: "Assigned room number" },
  { label: "{Seat_ID}", description: "Assigned seat ID" },
  { label: "{Exam_Date}", description: "Examination date" },
  { label: "{Exam_Time}", description: "Examination time" },
  { label: "{Subject}", description: "Subject name" },
]

const activityLog = [
  { time: "10:45 AM", regNo: "SJCET21CS001", email: "arun.kumar@sjcet.ac.in", status: "sent" },
  { time: "10:45 AM", regNo: "SJCET21CS002", email: "priya.sharma@sjcet.ac.in", status: "sent" },
  { time: "10:44 AM", regNo: "SJCET21EC003", email: "rahul.menon@sjcet.ac.in", status: "failed" },
  { time: "10:44 AM", regNo: "SJCET21ME004", email: "sneha.nair@sjcet.ac.in", status: "sent" },
  { time: "10:43 AM", regNo: "SJCET21CS005", email: "vishnu.das@sjcet.ac.in", status: "sent" },
  { time: "10:43 AM", regNo: "SJCET21EC006", email: "anjali.thomas@sjcet.ac.in", status: "pending" },
]

export function EmailNotifications() {
  const [subject, setSubject] = useState("Your Examination Seating Arrangement - SJCET")
  const [body, setBody] = useState(`Dear {Student_Name},

This is to inform you about your seating arrangement for the upcoming examination.

Room Number: {Room_No}
Seat ID: {Seat_ID}
Date: {Exam_Date}
Time: {Exam_Time}
Subject: {Subject}

Please arrive at least 15 minutes before the scheduled time.

Best regards,
Examination Cell
St. Joseph's College of Engineering and Technology`)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + " " + variable)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Notifications</h1>
        <p className="text-muted-foreground">Send seating arrangement notifications to students</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
                <p className="text-2xl font-bold text-foreground">1,245</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent Successfully</p>
                <p className="text-2xl font-bold text-foreground">1,180</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed/Bounced</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">53</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Insert Variables</Label>
              <div className="flex flex-wrap gap-2">
                {variableChips.map((chip) => (
                  <Badge
                    key={chip.label}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => insertVariable(chip.label)}
                  >
                    {chip.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[250px] font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Email Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-card max-h-[400px] overflow-y-auto">
              <div className="border-b pb-3 mb-3">
                <p className="text-xs text-muted-foreground">From: examcell@sjcet.ac.in</p>
                <p className="text-xs text-muted-foreground">To: student@sjcet.ac.in</p>
                <p className="font-medium text-foreground mt-2">{subject}</p>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {body
                  .replace("{Student_Name}", "Arun Kumar")
                  .replace("{Room_No}", "Room 201")
                  .replace("{Seat_ID}", "A-12")
                  .replace("{Exam_Date}", "Jan 15, 2024")
                  .replace("{Exam_Time}", "9:30 AM")
                  .replace("{Subject}", "Data Structures")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label htmlFor="scheduleDate">Schedule Send</Label>
                <div className="flex gap-2">
                  <Input
                    id="scheduleDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-40"
                  />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
            <Button size="lg" className="bg-primary">
              <Send className="w-4 h-4 mr-2" />
              Send Email Blast Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Sent</TableHead>
                <TableHead>Student Reg No</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLog.map((log, index) => (
                <TableRow key={`log-${log.regNo}-${index}`}>
                  <TableCell className="text-muted-foreground">{log.time}</TableCell>
                  <TableCell className="font-medium">{log.regNo}</TableCell>
                  <TableCell>{log.email}</TableCell>
                  <TableCell className="text-center">
                    {log.status === "sent" && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Sent
                      </Badge>
                    )}
                    {log.status === "failed" && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    {log.status === "pending" && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.status === "failed" && (
                      <Button variant="ghost" size="sm">
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Resend
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
