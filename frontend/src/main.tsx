import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import StudentSeatingPage from "./studentsSeating"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname.toLowerCase() === "/studentsseating" ? <StudentSeatingPage /> : <App />}
  </StrictMode>
)
