"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

import {
  LayoutGrid,
  Building2,
  Settings,
  FileText,
  Mail,
  CalendarDays,
  Users,
} from "lucide-react"

interface DashboardHomeProps {
  onNavigate: (page: string) => void
}

export default function Dashboard({ onNavigate }: DashboardHomeProps) {
  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to the Examination Cell Portal
        </p>
      </div>

      {/* Main Functional Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
          onClick={() => onNavigate("exam-session")}
        >
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">New Exam Session</h3>
            <p className="text-sm text-muted-foreground">
              Create and configure examination sessions
            </p>
          </div>
        </CardContent>
      </Card>
      
        <Card
          className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
          onClick={() => onNavigate("room-config")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Room Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Add and manage classrooms
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
          onClick={() => onNavigate("seating")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Seating Allocation</h3>
              <p className="text-sm text-muted-foreground">
                Generate and view seating plans
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
          onClick={() => onNavigate("configurations")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Settings className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">System Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Manage rules and allocation logic
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
          onClick={() => onNavigate("reports")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Reports</h3>
              <p className="text-sm text-muted-foreground">
                Generate seating & duty reports
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
          onClick={() => onNavigate("email")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Send seating & duty alerts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
          onClick={() => onNavigate("invigilator")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold">Invigilator Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage faculty duty assignments
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Upcoming Examinations Panel (Scrollable & No Routing) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="w-5 h-5 text-primary" />
            Upcoming Examinations
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {[
              { name: "S5 University Exam - Slot A", date: "March 12, 2026", venue: "Main Block" },
              { name: "Internal Assessment - S3", date: "March 18, 2026", venue: "Block C" },
              { name: "Lab Examination - S6", date: "March 22, 2026", venue: "Computer Lab 2" },
              { name: "Improvement Exam - S4", date: "March 28, 2026", venue: "Block B" },
              { name: "Supplementary Exam - S2", date: "April 02, 2026", venue: "Main Hall" },
            ].map((exam, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-muted/30"
              >
                <p className="font-medium text-foreground">{exam.name}</p>
                <p className="text-sm text-muted-foreground">
                  {exam.date}
                </p>
                <p className="text-sm text-muted-foreground">
                  Venue: {exam.venue}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
