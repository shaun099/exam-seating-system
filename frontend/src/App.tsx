import { Suspense, lazy, useState } from "react";

const DashboardLayout = lazy(() =>
  import("./component/layout/DashboardLayout").then((module) => ({
    default: module.DashboardLayout,
  }))
);
const LoginForm = lazy(() =>
  import("./Auth/login").then((module) => ({ default: module.LoginForm }))
);
const SeatingAllocation = lazy(() =>
  import("./component/pages/seating_allocation").then((module) => ({
    default: module.SeatingAllocation,
  }))
);
const Configurations = lazy(() =>
  import("./component/pages/configuration").then((module) => ({
    default: module.Configurations,
  }))
);
const Reports = lazy(() => import("./component/pages/Report"));
const EmailNotifications = lazy(() =>
  import("./component/pages/email-notifications")
);
const Dashboard = lazy(() => import("./component/pages/Dashboard"));
const ExamSessionWizard = lazy(() =>
  import("./component/pages/ExamSession/ExamSessionWizard").then((module) => ({
    default: module.ExamSessionWizard,
  }))
);
const RoomConfig = lazy(() => import("./component/pages/room-config"));
const AdminPortal = lazy(() =>
  import("./adminportal/admin").then((module) => ({
    default: module.AdminPortal,
  }))
);
const AdminReports = lazy(() => import("./adminportal/adminreports"));
const ClassMatrixPreview = lazy(() =>
  import("./component/pages/ClassMatrixPreview").then((module) => ({
    default: module.ClassMatrixPreview,
  }))
);

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

  "site-activation": [{ label: "Home", href: "/" }, { label: "Site Activation" }],
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

  const loadingFallback = (
    <div className="p-6 text-sm text-muted-foreground">Loading...</div>
  );

  // Show login if not logged in
  if (!userType) {
    return (
      <Suspense fallback={loadingFallback}>
        <LoginForm onLogin={handleLogin} />
      </Suspense>
    );
  }

  // Show Admin Portal for admin users
  if (userType === "admin") {
    return (
      <Suspense fallback={loadingFallback}>
        {currentPage === "admin-reports" ? (
          <AdminReports onLogout={handleLogout} onNavigate={handleNavigate} />
        ) : (
          <AdminPortal onLogout={handleLogout} onNavigate={handleNavigate} />
        )}
      </Suspense>
    );
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

      case "site-activation":
        return <SiteActivation />;

      case "room-config":
        return <RoomConfig />;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Suspense fallback={loadingFallback}>
      <DashboardLayout
        currentPage={currentPage}
        breadcrumbs={breadcrumbMap[currentPage]}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {renderPage()}
      </DashboardLayout>
    </Suspense>
  );
}

export default App;
