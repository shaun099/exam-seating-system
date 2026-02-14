"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Building2,
  Settings,
  FileText,
  Shield,
  UserCog,
  Database,
  Activity,
  LogOut,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX
} from "lucide-react"

interface AdminPortalProps {
  onLogout: () => void
}

interface PendingStaff {
  id: string
  name: string
  email: string
  department: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export function AdminPortal({ onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals'>('overview')
  
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
      alert("Staff member approved successfully!")
    }
  }

  const handleReject = (id: string) => {
    if (confirm("Reject this staff member's portal access request?")) {
      setPendingStaff(pendingStaff.map(staff => 
        staff.id === id ? { ...staff, status: 'rejected' } : staff
      ))
      alert("Staff member rejected.")
    }
  }

  const pendingCount = pendingStaff.filter(s => s.status === 'pending').length
  const approvedCount = pendingStaff.filter(s => s.status === 'approved').length
  const rejectedCount = pendingStaff.filter(s => s.status === 'rejected').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Portal</h1>
                <p className="text-sm text-slate-300">SJCET Examination Cell</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Administrator</span>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-slate-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors relative ${
                activeTab === 'approvals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Staff Approvals
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome, Administrator
              </h2>
              <p className="text-gray-600 mt-1">
                Manage system settings and user permissions
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Staff</p>
                      <p className="text-3xl font-bold text-gray-900">{pendingStaff.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Approvals</p>
                      <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved Staff</p>
                      <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <UserX className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserCog className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">User Management</h3>
                      <p className="text-sm text-gray-600">Manage staff accounts and permissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">System Settings</h3>
                      <p className="text-sm text-gray-600">Configure system parameters</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Room Management</h3>
                      <p className="text-sm text-gray-600">Configure examination rooms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-7 h-7 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Audit Logs</h3>
                      <p className="text-sm text-gray-600">View system activity logs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center">
                      <Database className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Database Backup</h3>
                      <p className="text-sm text-gray-600">Manage data backups</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Security Settings</h3>
                      <p className="text-sm text-gray-600">Configure security policies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'approvals' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Staff Approval Requests
              </h2>
              <p className="text-gray-600 mt-1">
                Review and approve staff access to the Examination Cell Portal
              </p>
            </div>

            {/* Approval Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Clock className="w-10 h-10 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-700 font-medium">Pending Requests</p>
                      <p className="text-3xl font-bold text-orange-900">{pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                    <div>
                      <p className="text-sm text-green-700 font-medium">Approved</p>
                      <p className="text-3xl font-bold text-green-900">{approvedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <XCircle className="w-10 h-10 text-red-600" />
                    <div>
                      <p className="text-sm text-red-700 font-medium">Rejected</p>
                      <p className="text-3xl font-bold text-red-900">{rejectedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Approvals Table */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg">Staff Access Requests</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Staff Name</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Department</TableHead>
                        <TableHead className="font-semibold">Requested At</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingStaff.map((staff) => (
                        <TableRow key={staff.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">
                            {staff.name}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {staff.email}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {staff.department}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {staff.requestedAt}
                          </TableCell>
                          <TableCell className="text-center">
                            {staff.status === 'pending' && (
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {staff.status === 'approved' && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            {staff.status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {staff.status === 'pending' && (
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(staff.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(staff.id)}
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {staff.status !== 'pending' && (
                              <div className="text-center text-sm text-gray-500">
                                No actions
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pendingStaff.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium">No staff requests</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Staff approval requests will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

