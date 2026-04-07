import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import StudentSeatingPage from "./studentsSeating";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname.toLowerCase() === "/find-my-seat" ? (
      <StudentSeatingPage />
    ) : (
      <App />
    )}
  </StrictMode>,
);
