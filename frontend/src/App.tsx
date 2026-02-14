
import { useState } from "react";

import { DashboardLayout } from "./component/layout/DashboardLayout";
import { LoginForm } from "./Auth/login"
import { SeatingAllocation } from "./component/pages/seating_allocation";
import { Configurations } from "./component/pages/configuration";
import Reports from "./component/pages/Report";
import EmailNotifications from "./component/pages/email-notifications";
import Dashboard from "./component/pages/Dashboard";
import { ExamSessionWizard } from "./component/pages/ExamSession/ExamSessionWizard";
import { RoomConfig } from "./components/pages/room-config";
import { AdminPortal } from "./adminportal/admin";

type UserType = 'admin' | 'staff' | null;

const breadcrumbMap: Record<string, { label: string; href?: string }[]> = {
  dashboard: [{ label: "Home", href: "/" }, { label: "Dashboard" }],

  "exam-session": [
    { label: "Home", href: "/" },
    { label: "New Exam Session" },
  ],

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

  email: [{ label: "Home", href: "/" }, { label: "Email Notifications" }],
};

function App() {
  const [userType, setUserType] = useState<UserType>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  
  const handleLogin = (type: 'admin' | 'staff') => {
    setUserType(type);
  };

  const handleLogout = () => {
    setUserType(null);
    setCurrentPage("dashboard");
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // Show login if not logged in
  if (!userType) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Show Admin Portal for admin users
  if (userType === 'admin') {
    return <AdminPortal onLogout={handleLogout} />
  }

  // Staff Portal - render pages based on currentPage
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;

      case "seating":
        return <SeatingAllocation />;

      case "configurations":
        return <Configurations />;

      case "reports":
        return <Reports />;

      case "exam-session":
        return (
          <ExamSessionWizard
            onCancel={() => setCurrentPage("dashboard")}
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

export default App
