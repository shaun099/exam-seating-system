"use client"

import { useState } from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardHome } from "@/components/pages/dashboard-home"
import { SessionWizard } from "@/components/pages/new-session/session-wizard"
import { InvigilatorMgmt } from "@/components/pages/invigilator-mgmt"
import { Configurations } from "@/components/pages/configurations"
import { SeatingAllocation } from "@/components/pages/seating-allocation"
import { EmailNotifications } from "@/components/pages/email-notifications"
import { LoginForm } from "@/Auth/login"
import { Reports } from "@/components/pages/reporters"
import { RoomConfig } from "@/components/pages/room-config"
type Page =
  | "dashboard"
  | "new-session"
  | "room-config"
  | "seating"
  | "invigilator"
  | "configurations"
  | "reports"
  | "email"

const breadcrumbMap: Record<Page, string[]> = {
  dashboard: ["Home", "Dashboard"],
  "new-session": ["Home", "New Exam Session"],
  "room-config": ["Home", "Room Configuration"],
  seating: ["Home", "Seating Allocation"],
  invigilator: ["Home", "Invigilator Management"],
  configurations: ["Home", "System Configuration"],
  reports: ["Home", "Reports"],
  email: ["Home", "Email Notifications"],
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentPage("dashboard")
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleStartNewSession = () => {
    setCurrentPage("new-session")
  }

  const handleSessionComplete = () => {
    setCurrentPage("seating")
  }

  const handleSessionCancel = () => {
    setCurrentPage("dashboard")
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardHome
            onStartNewSession={handleStartNewSession}
            onNavigate={handleNavigate

            }
          />
        )
      case "new-session":
        return (
          <SessionWizard
            onComplete={handleSessionComplete}
            onCancel={handleSessionCancel}
          />
        )
      case "room-config":
        return <RoomConfig />
      case "seating":
        return <SeatingAllocation />
      case "invigilator":
        return <InvigilatorMgmt />
      case "configurations":
        return <Configurations />
      case "reports":
        return <Reports />
      case "email":
        return <EmailNotifications />
      default:
        return (
          <DashboardHome
            onStartNewSession={handleStartNewSession}
            onNavigate={handleNavigate}
          />
        )
    }
  }

  return (  
    <DashboardLayout
      currentPage={currentPage}
      breadcrumbs={breadcrumbMap[currentPage]}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  )
}