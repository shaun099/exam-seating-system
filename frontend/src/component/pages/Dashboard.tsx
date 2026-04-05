"use client";

import { Card, CardContent } from "../ui/card";
import {
  LayoutGrid,
  Building2,
  Settings,
  FileText,
  Mail,
  CalendarDays,
} from "lucide-react";

interface DashboardHomeProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardHomeProps) {
  return (
    <div className="w-full p-4 md:p-8 space-y-8 bg-background">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Examination Cell Portal
        </p>
      </div>

      {/* Main Functional Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer border transition-all hover:shadow-lg hover:border-blue-500 hover:bg-blue-50/50"
          onClick={() => onNavigate("exam-session")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
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
          className="cursor-pointer border transition-all hover:shadow-lg hover:border-blue-500 hover:bg-blue-50/50"
          onClick={() => onNavigate("room-config")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Room Configuration
              </h3>
              <p className="text-sm text-muted-foreground">
                Add and manage classrooms
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border transition-all hover:shadow-lg hover:border-blue-500 hover:bg-blue-50/50"
          onClick={() => onNavigate("seating")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Seating Allocation
              </h3>
              <p className="text-sm text-muted-foreground">
                Generate and view seating plans
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border transition-all hover:shadow-lg hover:border-blue-500 hover:bg-blue-50/50"
          onClick={() => onNavigate("configurations")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                System Configuration
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage rules and allocation logic
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border transition-all hover:shadow-lg hover:border-blue-500 hover:bg-blue-50/50"
          onClick={() => onNavigate("reports")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
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
          className="cursor-pointer border transition-all hover:shadow-lg hover:border-blue-500 hover:bg-blue-50/50"
          onClick={() => onNavigate("site-activation")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Site Activation</h3>
              <p className="text-sm text-muted-foreground">
                Control active window by sem, slot, date and time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-10" />
    </div>
  );
}
