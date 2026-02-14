
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Lock, Eye, EyeOff, GraduationCap, CheckCircle, XCircle } from "lucide-react"

export function LoginForm({ onLogin }: { onLogin: (userType: 'admin' | 'staff') => void }) {

  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailValid, setEmailValid] = useState<boolean | null>(null)

  // Email validation pattern
  const validateEmail = (value: string) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@sjcetpalai\.ac\.in$/
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

  const handleLoginClick = () => {
    const cleanedEmail = email.trim().toLowerCase()
    const cleanedPassword = password.trim()

    // 1. Check email format
    if (!validateEmail(cleanedEmail)) {
      alert("Invalid email format")
      return
    }

    // 2. Check password
    if (cleanedPassword !== "adminpass") {
      alert("Wrong password")
      return
    }

    // 3. Notify Parent (page.tsx) based on email
    if (cleanedEmail === "admin@sjcetpalai.ac.in") {
      onLogin('admin') 
    } else {
      onLogin('staff')
    }
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center relative p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/sjcet.jpg')" }}
      ></div>

      {/* White overlay */}
      <div className="absolute inset-0 bg-white/40"></div>

      {/* Logo */}
      <img
        src="/autologo.jpg"
        alt="College Logo"
        className="absolute top-4 left-2 w-28 h-14 object-contain"
      />

      {/* Content */}
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center shadow-lg mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 text-center">
            Examination Cell Portal
          </h1>
          <p className="text-blue-800 text-sm text-center">
            St. Joseph's College of Engineering And Technology
          </p>
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
                    <Input
                      type="email"
                      placeholder="abc@sjcetpalai.ac.in"
                      value={email}
                      onChange={handleEmailChange}
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
                      className="pl-10 pr-10 border-blue-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                  size="lg"
                  onClick={handleLoginClick}
                  disabled={emailValid !== true || password.trim() === ""}
                >
                  Access Portal
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="mt-6 space-y-4">
                 {/* Signup Form content... */}
                 <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" />
                </div>
                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-xs text-blue-800 text-center">
              Authorized Personnel Only - St. Joseph's College
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}


