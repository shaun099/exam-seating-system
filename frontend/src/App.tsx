import { useState } from "react";

import { DashboardLayout } from "./component/layout/DashboardLayout";
import { LoginForm } from "./Auth/login";
import { SeatingAllocation } from "./component/pages/seating_allocation";
import { Configurations } from "./component/pages/configuration";
import Reports from "./component/pages/Report";
import EmailNotifications from "./component/pages/email-notifications";
import Dashboard from "./component/pages/Dashboard";
import { ExamSessionWizard } from "./component/pages/ExamSession/ExamSessionWizard";
import  RoomConfig  from "./component/pages/room-config";
import { AdminPortal } from "./adminportal/admin";
import AdminReports from "./adminportal/adminreports";
import { ClassMatrixPreview } from "./component/pages/ClassMatrixPreview";

type UserType = "admin" | "staff" | null;

const AUTH_ROLE_KEY = "userRole";
const AUTH_TOKEN_KEY = "token";

const breadcrumbMap: Record<string, { label: string; href?: string }[]> = {
  dashboard: [{ label: "Home", href: "/" }, { label: "Dashboard" }],

  "exam-session": [{ label: "Home", href: "/" }, { label: "New Exam Session" }],

  "room-config": [
    { label: "Home", href: "/" },
    { label: "Room Configuration" },
  ],

  seating: [{ label: "Home", href: "/" }, { label: "Seating Allocation" }],

  invigilator: [
    { label: "Home", href: "/" },
    { label: "Invigilator Management" },
  ],

  configurations: [
    { label: "Home", href: "/" },
    { label: "System Configuration" },
  ],

  reports: [{ label: "Home", href: "/" }, { label: "Reports" }],

  "class-matrix-preview": [
    { label: "Home", href: "/" },
    { label: "Class Matrix Preview" },
  ],  

  email: [{ label: "Home", href: "/" }, { label: "Email Notifications" }],
};

function App() {
  const [userType, setUserType] = useState<UserType>(() => {
    const savedRole = localStorage.getItem(AUTH_ROLE_KEY);
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if ((savedRole === "admin" || savedRole === "staff") && savedToken) {
      return savedRole;
    }

    return null;
  });
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogin = (type: "admin" | "staff") => {
    setUserType(type);
  };

  const handleLogout = () => {
    setUserType(null);
    setCurrentPage("dashboard");
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // Show login if not logged in
  if (!userType) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Show Admin Portal for admin users
  if (userType === "admin") {
    if (currentPage === "admin-reports") {
      return (
        <AdminReports onLogout={handleLogout} onNavigate={handleNavigate} />
      );
    }

    // Default admin view
    return <AdminPortal onLogout={handleLogout} onNavigate={handleNavigate} />;
  }

  // Staff Portal - render pages based on currentPage
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;

      case "seating":
        return <SeatingAllocation onNavigate={handleNavigate} />;

      case "configurations":
        return <Configurations />;

      case "reports":
        return <Reports onNavigate={handleNavigate} />;

      case "class-matrix-preview": {
        const sem = localStorage.getItem("classMatrix.sem") || "S1";
        const slot = localStorage.getItem("classMatrix.slot") || "A";
        return <ClassMatrixPreview sem={sem} slot={slot} onNavigate={handleNavigate} />;
      }

      case "exam-session":
        return (
          <ExamSessionWizard
            onCancel={() => setCurrentPage("dashboard")}
            onNavigate={handleNavigate}
          />
        );

      case "email":
        return <EmailNotifications />;

      case "room-config":
        return <RoomConfig />;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <DashboardLayout
      currentPage={currentPage}
      breadcrumbs={breadcrumbMap[currentPage]}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

export default App;
