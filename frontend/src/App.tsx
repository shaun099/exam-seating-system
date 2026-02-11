import { LoginForm } from "./Auth/login.tsx"
import Home from "./App/page.tsx"

function App() {
  return (
    <>
      <Home />
      <LoginForm onLogin={function (): void {
        throw new Error("Function not implemented.")
      } } />
    </>
  )
}

export default App
