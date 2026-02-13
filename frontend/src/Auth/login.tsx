import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Lock, Eye, EyeOff, GraduationCap, CheckCircle, XCircle } from "lucide-react"

export function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("adminpass")
  const [emailValid, setEmailValid] = useState<boolean | null>(null)

  // Email validation pattern
  const validateEmail = (value: string) => {
    const pattern = /^[a-zA-Z0-9._-]+@sjcet\.ac\.in$/
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
    // Check if email matches pattern and password is correct
    if (validateEmail(email) && password === "adminpass") {
      onLogin()
    } else {
      alert("Invalid Email or Password")
    }
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center relative p-4">
      
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/sjcet.jpg')" }}
      ></div>

      {/* White Shade */}
      <div className="absolute inset-0 bg-white/40"></div>

      {/* Logo in top-left */}
      <img
        src="/autologo.jpg"
        alt="College Logo"
        className="absolute top-4 left-1 w-29 h-14 object-contain z-90"
      />

      {/* Content */}
      <div className="relative w-full max-w-md">

        {/* Graduation Cap Icon */}
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

        {/* Login Card */}
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
                  <Label htmlFor="email" className="text-blue-900">Email ID</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="abc@sjcet.ac.in"
                      value={email}
                      onChange={handleEmailChange}
                      className={`pl-10 pr-10 border-2 ${
                        emailValid === null 
                          ? 'border-blue-300 focus:border-blue-500' 
                          : emailValid 
                          ? 'border-green-500 focus:border-green-600' 
                          : 'border-red-500 focus:border-red-600'
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
                    <p className="text-xs text-red-600 mt-1">
                      Email must match pattern: abc@sjcet.ac.in
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-blue-900">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-blue-300 focus:border-blue-500"
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
                  disabled={emailValid !== true}
                >
                  Access Portal
                </Button>

              </TabsContent>

              {/* SIGNUP */}
              <TabsContent value="signup" className="mt-6 space-y-4">

                <div className="space-y-2">
                  <Label className="text-blue-900">Full Name</Label>
                  <Input className="border-blue-300" />
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900">Email</Label>
                  <Input className="border-blue-300" />
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900">Password</Label>
                  <Input type="password" className="border-blue-300" />
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