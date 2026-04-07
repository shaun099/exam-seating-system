import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import StudentSeatingPage from "./studentsSeating";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/find-my-seat" element={<StudentSeatingPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
