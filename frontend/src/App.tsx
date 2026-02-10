import { useState } from "react";
import { DashboardLayout } from "./component/layout/DashboardLayout";
import Reports from "./pages/Report";

const breadcrumbMap: Record<string, { label: string; href?: string }[]> = {
  dashboard: [{ label: "Home", href: "/" }, { label: "Dashboard" }],
  "new-session": [{ label: "Home", href: "/" }, { label: "New Exam Session" }],
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  // const handleLogin = () => {
  //   setIsLoggedIn(true);
  // };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
  };
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };
  // const handleStartNewSession = () => {
  //   setCurrentPage("new-session");
  // };
  // const handleSessionComplete = () => {
  //   setCurrentPage("seating");
  // };

  // const handleSessionCancel = () => {
  //   setCurrentPage("dashboard");
  // };

  if (!isLoggedIn) {
    // return <LoginForm onLogin={handleLogin} />
    <h1>Login please</h1>;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          // <DashboardHome
          //   onStartNewSession={handleStartNewSession}
          //   onNavigate={handleNavigate}
          // />
          <h1>dashboardHome</h1>
        );
      // case "new-session":
      //   return (
      //     <SessionWizard
      //       onComplete={handleSessionComplete}
      //       onCancel={handleSessionCancel}
      //     />
      //   );
      // case "room-config":
      //   return <RoomConfig />;
      // case "seating":
      //   return <SeatingAllocation />;
      // case "invigilator":
      //   return <InvigilatorMgmt />;
      // case "configurations":
      //   return <Configurations />;
      case "reports":
        return <Reports />;
      // case "email":
      //   return <EmailNotifications />;
      default:
        return (
          // <DashboardHome
          //   onStartNewSession={handleStartNewSession}
          //   onNavigate={handleNavigate}
          // />
          <h1>404</h1>
        );
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
