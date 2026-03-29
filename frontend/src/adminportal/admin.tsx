"use client"

import { useState, useEffect } from "react"
import { Card, CardContent} from "@/component/ui/card"
import { Button } from "@/component/ui/button"
import { Badge } from "@/component/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/component/ui/table"
import {
  Users,
  LogOut,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  FileBarChart,
  UserMinus,
  ArrowLeft
} from "lucide-react"

interface AdminPortalProps {
  onLogout: () => void
  onNavigate: (page: string) => void 
  initialView?: 'overview' | 'approvals'
}

interface PendingStaff {
  id: string
  name: string
  email: string
  department?: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export function AdminPortal({ onLogout, onNavigate, initialView = 'overview' }: AdminPortalProps) {

  const [view, setView] = useState<'overview' | 'approvals'>(initialView)
  const [pendingStaff, setPendingStaff] = useState<PendingStaff[]>([])

  useEffect(() => {
    setView(initialView)
  }, [initialView])

  // ✅ FETCH USERS
  useEffect(() => {
    const token = localStorage.getItem("token")

    fetch("http://127.0.0.1:8000/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingStaff(data)
        } else {
          console.error("Invalid response:", data)
          setPendingStaff([])
        }
      })
      .catch(() => setPendingStaff([]))
  }, [])

  // ✅ APPROVE
  const handleApprove = async (id: string) => {
    if (!confirm("Approve this staff member for portal access?")) return

    const token = localStorage.getItem("token")

    await fetch(`http://127.0.0.1:8000/admin/approve/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    setPendingStaff(prev =>
      prev.map(staff =>
        staff.id === id ? { ...staff, status: 'approved' } : staff
      )
    )
  }

  // ✅ REJECT
  const handleReject = async (id: string) => {
    if (!confirm("Reject this staff member's portal access request?")) return

    const token = localStorage.getItem("token")

    await fetch(`http://127.0.0.1:8000/admin/revoke/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    setPendingStaff(prev =>
      prev.map(staff =>
        staff.id === id ? { ...staff, status: 'rejected' } : staff
      )
    )
  }

  // ✅ REMOVE → back to pending
  const handleRemove = async (id: string) => {
    if (!confirm("Remove access for this staff member?")) return

    const token = localStorage.getItem("token")

    await fetch(`http://127.0.0.1:8000/admin/revoke/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    setPendingStaff(prev =>
      prev.map(staff =>
        staff.id === id ? { ...staff, status: 'pending' } : staff
      )
    )
  }

  const approvedCount = pendingStaff.filter(s => s.status === 'approved').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administrator</h1>
              <p className="text-sm text-slate-300 italic">SJCET Examination Cell</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={onLogout} 
              className="bg-red-600 text-black shadow-sm hover:bg-red-800 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">

        {view === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600 mt-1">Select an action to manage the examination system</p>
            </div>

            <Card className="border border-blue-100 bg-blue-50/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-[10px] font-bold uppercase">
                      Total Faculty Working
                    </p>
                    <p className="text-3xl font-black text-blue-900">
                      {approvedCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:border-blue-500 transition-all shadow-sm group"
                onClick={() => setView('approvals')}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold">Staff Approvals</h3>
                  <p className="text-gray-600 mt-2 text-sm">Review pending portal access requests</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-green-500 transition-all shadow-sm group"
                onClick={() => onNavigate('admin-reports')}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileBarChart className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">System Reports</h3>
                  <p className="text-gray-600 mt-2 text-sm">View reports</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {view === 'approvals' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setView('overview')} className="text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Staff Access Requests</h2>
            </div>

            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 z-10">
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pendingStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell>
                            {staff.name}
                            <p className="text-xs text-gray-400">{staff.requestedAt}</p>
                          </TableCell>

                          <TableCell>{staff.email}</TableCell>

                          <TableCell>
                            <Badge className={`${
                              staff.status === 'pending'
                                ? 'bg-orange-100 text-orange-700'
                                : staff.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {staff.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {staff.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {staff.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {staff.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              {staff.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(staff.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 rounded-md"
                                  >
                                    Approve
                                  </Button>

                                  <Button
                                    size="sm"
                                    onClick={() => handleReject(staff.id)}
                                    className="h-8 px-4 rounded-md border border-red-500 text-red-600 bg-white hover:bg-red-50"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {staff.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleRemove(staff.id)}
                                  className="h-8 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center"
                                >
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              )}

                              {staff.status === 'rejected' && (
                                <span className="text-xs text-gray-400 italic">
                                  Access Denied
                                </span>
                              )}
                            </div>
                          </TableCell>

                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}