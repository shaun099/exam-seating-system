
"use client"

import { useState } from "react"

// Layouts & Components
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardHome } from "@/components/pages/dashboard-home"
import { SessionWizard } from "@/components/pages/new-session/session-wizard"
import { InvigilatorMgmt } from "@/components/pages/invigilator-mgmt"
import { Configurations } from "@/components/pages/configurations"
import { SeatingAllocation } from "@/components/pages/seating-allocation"
import { EmailNotifications } from "@/components/pages/email-notifications"
import { Reports } from "@/components/pages/reporters"
import { RoomConfig } from "@/components/pages/room-config"

// Your Custom Auth & Portals
import { LoginForm } from "@/Auth/login" // Adjust path as needed
import { AdminPortal } from "@/adminportal/admin" // Adjust path as needed

type UserType = 'admin' | 'staff' | null

type Page =
  | "dashboard"
  | "new-session"
  | "room-config"
  | "seating"
  | "invigilator"
  | "configurations"
  | "reports"
  | "email"

export default function Home() {
  const [userType, setUserType] = useState<UserType>(null)
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  const handleLogin = (type: 'admin' | 'staff') => {
    setUserType(type)
    setCurrentPage("dashboard") // Reset to dashboard on login
  }

  const handleLogout = () => {
    setUserType(null)
    setCurrentPage("dashboard")
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  // --- 1. LOGIN STATE ---
  if (!userType) {
    return <LoginForm onLogin={handleLogin} />
  }

  // --- 2. ADMIN PORTAL STATE ---
  if (userType === 'admin') {
    return <AdminPortal onLogout={handleLogout} />
  }

  // --- 3. STAFF PORTAL STATE ---
  // This helps render the specific content inside the Dashboard Layout
  const renderStaffContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardHome onStartNewSession={() => setCurrentPage("new-session")} onNavigate={handleNavigate} />
      case "new-session":
        return <SessionWizard onComplete={() => setCurrentPage("seating")} onCancel={() => setCurrentPage("dashboard")} />
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
        return <DashboardHome onStartNewSession={() => setCurrentPage("new-session")} onNavigate={handleNavigate} />
    }
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      breadcrumbs={[]}
    >
      {renderStaffContent()}
    </DashboardLayout>
  )
}





