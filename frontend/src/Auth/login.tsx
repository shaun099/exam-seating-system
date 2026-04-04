import { useState } from "react"
import { Button } from "@/component/ui/button"
import { Card, CardFooter, CardHeader, CardContent } from "@/component/ui/card"
import { Input } from "@/component/ui/input"
import { Label } from "@/component/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs"
import { Mail, Lock, Eye, EyeOff, GraduationCap, CheckCircle, XCircle, ShieldAlert } from "lucide-react"

export function LoginForm({ onLogin }: { onLogin: (userType: 'admin' | 'staff') => void }) {

  const [showPassword, setShowPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [activeTab, setActiveTab] = useState("login")
  
  // Login States
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailValid, setEmailValid] = useState<boolean | null>(null)

  // Signup States
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [signupEmailValid, setSignupEmailValid] = useState<boolean | null>(null)

  // Force Password Change States
  const [isResetting, setIsResetting] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  const API_BASE = import.meta.env.VITE_API_URL

  const validateEmail = (value: string) => {
    const pattern = /^[a-zA-Z0-9._%+-]*[a-zA-Z][a-zA-Z0-9._%+-]*@sjcetpalai\.ac\.in$/
    return pattern.test(value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setEmailValid(value.length > 0 ? validateEmail(value) : null)
  }

  const handleSignupEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSignupEmail(value)
    setSignupEmailValid(value.length > 0 ? validateEmail(value) : null)
  }

  const handleLoginClick = async () => {
    const cleanedEmail = email.trim().toLowerCase()
    const cleanedPassword = password.trim()

    if (!validateEmail(cleanedEmail)) {
      alert("Invalid email format")
      return
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail, password: cleanedPassword })
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.detail || "Login failed")
        return
      }

      localStorage.setItem("token", data.access_token)

      // Check if user needs to change password (mass imported)
      if (data.needs_password_change) {
        setIsResetting(true)
      } else {
        onLogin(data.role)
      }

    } catch (err) {
      alert("Server error")
    }
  }

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmNewPassword) return alert("Passwords do not match")
    if (newPassword.length < 6) return alert("Password must be at least 6 characters")

    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE}/auth/update-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      })

      if (res.ok) {
        alert("Password updated! Please login again.")
        setIsResetting(false)
        setPassword("") // Clear temporary password
        localStorage.removeItem("token")
      } else {
        const error = await res.json()
        alert(error.detail || "Update failed")
      }
    } catch (err) {
      alert("Update failed")
    }
  }

  const handleSignup = async () => {
    if (!signupName.trim()) return alert("Enter full name")
    if (!validateEmail(signupEmail.trim())) return alert("Invalid email format")
    if (signupPassword !== confirmPassword) return alert("Passwords do not match")

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail.trim(),
          password: signupPassword,
          full_name: signupName.trim()
        })
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.detail || "Signup failed")
        return
      }

      alert("Signup successful. Wait for admin approval.")
      setActiveTab("login")
    } catch (err) {
      alert("Server error")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isResetting) {
        handlePasswordUpdate()
      } else if (activeTab === "login") {
        if (validateEmail(email) && password.trim() !== "") handleLoginClick()
      } else {
        if (signupName.trim() && validateEmail(signupEmail) && signupPassword && signupPassword === confirmPassword) handleSignup()
      }
    }
  }

  // --- RENDER PASSWORD RESET INTERFACE ---
  if (isResetting) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 p-4 relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/sjcet.jpg')" }}></div>
        <Card className="w-full max-w-md shadow-2xl border-orange-200 relative bg-white/95">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shadow-sm">
              <ShieldAlert className="text-orange-600 w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Security Update</h2>
            <p className="text-sm text-slate-500 italic">This is your first login. For security, please set a permanent password.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-blue-900">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={handleKeyPress} placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label className="text-blue-900">Confirm New Password</Label>
              <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} onKeyDown={handleKeyPress} placeholder="Confirm new password" />
            </div>
            <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white" onClick={handlePasswordUpdate}>
              Update & Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- REGULAR LOGIN/SIGNUP RENDER ---
  return (
    <div className="h-screen overflow-hidden flex items-center justify-center relative p-4">
      <div className="absolute inset-0 bg-cover bg-center opacity-75" style={{ backgroundImage: "url('/sjcet.jpg')" }}></div>
      <div className="absolute inset-0 bg-white/50"></div>
      <img src="/autologo.jpg" alt="College Logo" className="absolute top-4 left-2 w-30 h-14 object-contain" />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center shadow-lg mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 text-center">Examination Cell Portal</h1>
          <p className="text-blue-800 text-sm text-center font-medium">St. Joseph's College of Engineering And Technology, Palai</p>
        </div>

        <Card className="shadow-xl border border-blue-200 bg-white/95 backdrop-blur">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-blue-100">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-blue-900">Email ID</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input type="email" placeholder="abc@sjcetpalai.ac.in" value={email} onChange={handleEmailChange} onKeyDown={handleKeyPress} className={`pl-10 pr-10 border-2 ${emailValid === null ? "border-blue-300" : emailValid ? "border-green-500" : "border-red-500"}`} />
                    {emailValid !== null && <div className="absolute right-3 top-1/2 -translate-y-1/2">{emailValid ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}</div>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyPress} className="pl-10 pr-10 border-blue-300" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold h-11" onClick={handleLoginClick} disabled={!validateEmail(email) || password.trim() === ""}>
                  Access Portal
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input type="email" value={signupEmail} onChange={handleSignupEmailChange} onKeyDown={handleKeyPress} className={`pl-10 pr-10 border-2 ${signupEmailValid === null ? "border-blue-300" : signupEmailValid ? "border-green-500" : "border-red-500"}`} />
                    {signupEmailValid !== null && <div className="absolute right-3 top-1/2 -translate-y-1/2">{signupEmailValid ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}</div>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showSignupPassword ? "text" : "password"} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} onKeyDown={handleKeyPress} />
                    <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKeyPress} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white" disabled={!signupName.trim() || !validateEmail(signupEmail) || signupPassword.trim() === "" || signupPassword !== confirmPassword} onClick={handleSignup}>
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-[10px] text-blue-800 text-center uppercase tracking-widest font-bold">Authorized Personnel Only</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}