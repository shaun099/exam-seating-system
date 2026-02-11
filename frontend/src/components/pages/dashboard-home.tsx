"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  LayoutGrid,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const allocationData = [
  { day: "Mon", completed: 20 },
  { day: "Tue", completed: 45 },
  { day: "Wed", completed: 65 },
  { day: "Thu", completed: 78 },
  { day: "Fri", completed: 89 },
  { day: "Sat", completed: 95 },
]

interface DashboardHomeProps {
  onStartNewSession: () => void
  onNavigate: (page: string) => void
}

export function DashboardHome({ onStartNewSession, onNavigate }: DashboardHomeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to the Examination Cell Portal</p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-primary bg-primary/5"
          onClick={onStartNewSession}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">New Exam Session</h3>
                <p className="text-sm text-muted-foreground">Start a new session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate("seating")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Seating Status</h3>
                <p className="text-sm text-muted-foreground">View allocations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate("room-config")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Manage Rooms</h3>
                <p className="text-sm text-muted-foreground">Configure classrooms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate("invigilator")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Faculty Duty</h3>
                <p className="text-sm text-muted-foreground">Assign invigilators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consolidated Live Reports */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Consolidated Live Reports</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming Exams</p>
                      <p className="text-2xl font-bold text-foreground">12</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rooms Available</p>
                      <p className="text-2xl font-bold text-foreground">28</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Staff Available</p>
                      <p className="text-2xl font-bold text-foreground">45</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions Complete</p>
                      <p className="text-2xl font-bold text-foreground">8</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Progress Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Allocation Progress</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4" />
                  This Week
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={allocationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Seating allocation completed for S6 Slot A", time: "2 hours ago", status: "success" },
              { action: "New room added: Block D - Room 401", time: "5 hours ago", status: "info" },
              { action: "Invigilator duty chart generated", time: "1 day ago", status: "success" },
              { action: "Student data imported for Internal Exam", time: "2 days ago", status: "info" },
            ].map((item, index) => (
              <div key={`activity-${index}`} className="flex items-center gap-4">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === "success" ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.action}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
