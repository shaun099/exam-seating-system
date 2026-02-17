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

// Updated interface to include initialView
interface AdminPortalProps {
  onLogout: () => void
  onNavigate: (page: string) => void 
  initialView?: 'overview' | 'approvals'
}

interface PendingStaff {
  id: string
  name: string
  email: string
  department: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export function AdminPortal({ onLogout, onNavigate, initialView = 'overview' }: AdminPortalProps) {
  const [view, setView] = useState<'overview' | 'approvals'>(initialView)
  
  // Sync internal view state if App.tsx passes a new initialView prop
  useEffect(() => {
    setView(initialView)
  }, [initialView])

  const [pendingStaff, setPendingStaff] = useState<PendingStaff[]>([
    {
      id: "1",
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@sjcetpalai.ac.in",
      department: "Computer Science",
      requestedAt: "2024-02-14 10:30 AM",
      status: "pending"
    },
    {
      id: "2",
      name: "Prof. Sneha Menon",
      email: "sneha.menon@sjcetpalai.ac.in",
      department: "Electronics",
      requestedAt: "2024-02-14 11:45 AM",
      status: "pending"
    },
    {
      id: "3",
      name: "Dr. Mohammed Ali",
      email: "mohammed.ali@sjcetpalai.ac.in",
      department: "Mechanical",
      requestedAt: "2024-02-13 02:15 PM",
      status: "pending"
    },
    {
      id: "4",
      name: "Prof. Lakshmi Nair",
      email: "lakshmi.nair@sjcetpalai.ac.in",
      department: "Civil",
      requestedAt: "2024-02-13 09:00 AM",
      status: "approved"
    },
    {
      id: "5",
      name: "Dr. Anil Thomas",
      email: "anil.thomas@sjcetpalai.ac.in",
      department: "Computer Science",
      requestedAt: "2024-02-12 04:30 PM",
      status: "rejected"
    }
  ])

  const handleApprove = (id: string) => {
    if (confirm("Approve this staff member for portal access?")) {
      setPendingStaff(pendingStaff.map(staff => 
        staff.id === id ? { ...staff, status: 'approved' } : staff
      ))
    }
  }

  const handleReject = (id: string) => {
    if (confirm("Reject this staff member's portal access request?")) {
      setPendingStaff(pendingStaff.map(staff => 
        staff.id === id ? { ...staff, status: 'rejected' } : staff
      ))
    }
  }

  const handleRemove = (id: string) => {
    if (confirm("Are you sure you want to remove this staff member from service?")) {
      setPendingStaff(pendingStaff.filter(staff => staff.id !== id))
    }
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
    
    {/* Ensure this button has no 'opacity-0' or 'invisible' classes */}
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

            {/* Compact Summary Card */}
            <Card className="border border-blue-100 bg-blue-50/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-blue-700 font-bold uppercase tracking-tight text-[10px]">
                      Total Faculty Working
                    </p>
                    <p className="text-3xl font-black text-blue-900 leading-none">
                      {approvedCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
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
                onClick={() => onNavigate('reports')}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileBarChart className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">System Reports</h3>
                  <p className="text-gray-600 mt-2 text-sm">View consolidated and room-wise reports</p>
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
                        <TableHead className="font-semibold">Staff Name</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Department</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingStaff.map((staff) => (
                        <TableRow key={staff.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium text-gray-900 py-4">
                            {staff.name}
                            <p className="text-[10px] text-gray-400 font-normal">{staff.requestedAt}</p>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm">{staff.email}</TableCell>
                          <TableCell className="text-gray-700 text-sm">{staff.department}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`shadow-none border-none ${
                              staff.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              staff.status === 'approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {staff.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {staff.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {staff.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {staff.status === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => handleApprove(staff.id)} className="bg-green-600 hover:bg-green-700 h-8">Approve</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleReject(staff.id)} className="border-red-600 text-red-600 h-8">Reject</Button>
                                </>
                              )}
                              {staff.status === 'approved' && (
                                <Button size="sm" variant="destructive" onClick={() => handleRemove(staff.id)} className="h-8 bg-red-600">
                                  <UserMinus className="w-4 h-4 mr-1" /> Remove
                                </Button>
                              )}
                              {staff.status === 'rejected' && <span className="text-xs text-gray-400 italic">Access Denied</span>}
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