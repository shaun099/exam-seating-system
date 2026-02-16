import { useState } from "react"
import { Button } from "@/component/ui/button"
import { Card, CardFooter, CardHeader } from "@/component/ui/card"
import { Input } from "@/component/ui/input"
import { Label } from "@/component/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/component/ui/tabs"
import { Mail, Lock, Eye, EyeOff, GraduationCap, CheckCircle, XCircle } from "lucide-react"

export function LoginForm({ onLogin }: { onLogin: (userType: 'admin' | 'staff') => void }) {

  const [showPassword, setShowPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [activeTab, setActiveTab] = useState("login")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailValid, setEmailValid] = useState<boolean | null>(null)

  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [signupEmailValid, setSignupEmailValid] = useState<boolean | null>(null)

  // Must contain at least one alphabet before @
  const validateEmail = (value: string) => {
    const pattern = /^[a-zA-Z0-9._%+-]*[a-zA-Z][a-zA-Z0-9._%+-]*@sjcetpalai\.ac\.in$/
    return pattern.test(value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (value.length > 0) {
      setEmailValid(validateEmail(value))
    } else {
      setEmailValid(null)
    }
  }

  const handleSignupEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSignupEmail(value)
    if (value.length > 0) {
      setSignupEmailValid(validateEmail(value))
    } else {
      setSignupEmailValid(null)
    }
  }

  const handleLoginClick = () => {
    const cleanedEmail = email.trim().toLowerCase()
    const cleanedPassword = password.trim()

    if (!validateEmail(cleanedEmail)) {
      alert("Invalid email format")
      return
    }

    if (cleanedPassword !== "adminpass") {
      alert("Wrong password")
      return
    }

    if (cleanedEmail === "admin@sjcetpalai.ac.in") {
      onLogin('admin')
    } else {
      onLogin('staff')
    }
  }

  const handleSignup = () => {
    if (!signupName.trim()) {
      alert("Enter full name")
      return
    }

    if (!validateEmail(signupEmail.trim())) {
      alert("Invalid email format")
      return
    }

    if (signupPassword !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    if (signupPassword.trim() === "") {
      alert("Enter password")
      return
    }

    alert("Account Created (mock)")
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    if (activeTab === "login") {
      if (validateEmail(email) && password.trim() !== "") {
        handleLoginClick()
      }
    } else {
      if (
        signupName.trim() &&
        validateEmail(signupEmail) &&
        signupPassword.trim() &&
        confirmPassword.trim() &&
        signupPassword === confirmPassword
      ) {
        handleSignup()
      }
    }
  }
}

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center relative p-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-75"
        style={{ backgroundImage: "url('/sjcet.jpg')" }}
      ></div>

      <div className="absolute inset-0 bg-white/50"></div>

      <img
        src="/autologo.jpg"
        alt="College Logo"
        className="absolute top-4 left-2 w-30 h-14 object-contain"
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center shadow-lg mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 text-center">
            Examination Cell Portal
          </h1>
          <p className="text-blue-800 text-sm text-center">
            St. Joseph's College of Engineering And Technology, Palai
          </p>
        </div>

        <Card className="shadow-xl border border-blue-200 bg-white/95 backdrop-blur">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-blue-100">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN */}
              <TabsContent value="login" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-blue-900">Email ID</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input
                      type="email"
                      placeholder="abc@sjcetpalai.ac.in"
                      value={email}
                      onChange={handleEmailChange}
                      onKeyDown={handleKeyPress}
                      className={`pl-10 pr-10 border-2 ${
                        emailValid === null
                          ? "border-blue-300"
                          : emailValid
                          ? "border-green-500"
                          : "border-red-500"
                      }`}
                    />
                    {emailValid !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailValid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {emailValid === false && (
                  <p className="text-xs text-red-600">
                    Email must match pattern: abc@sjcetpalai.ac.in
                  </p>
                )}
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="pl-10 pr-10 border-blue-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                  size="lg"
                  onClick={handleLoginClick}
                  disabled={!validateEmail(email) || password.trim() === ""}
                >
                  Access Portal
                </Button>
              </TabsContent>

              {/* SIGNUP */}
              <TabsContent value="signup" className="mt-6 space-y-4">

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input
                      type="email"
                      value={signupEmail}
                      onChange={handleSignupEmailChange}
                      onKeyDown={handleKeyPress}
                      className={`pl-10 pr-10 border-2 ${
                        signupEmailValid === null
                          ? "border-blue-300"
                          : signupEmailValid
                          ? "border-green-500"
                          : "border-red-500"
                      }`}
                    />
                    {signupEmailValid !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {signupEmailValid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {emailValid === false && (
                  <p className="text-xs text-red-600">
                    Email must match pattern: abc@sjcetpalai.ac.in
                  </p>
                )}
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                  disabled={
                    !signupName.trim() ||
                    !validateEmail(signupEmail) ||
                    signupPassword.trim() === "" ||
                    confirmPassword.trim() === "" ||
                    signupPassword !== confirmPassword
                  }
                  onClick={handleSignup}
                >
                  Create Account
                </Button>
              </TabsContent>

            </Tabs>
          </CardHeader>

          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-xs text-blue-800 text-center">
              Authorized Personnel Only - St. Joseph's College of Engineering And Technology, Palai [ Autonomous ]
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}