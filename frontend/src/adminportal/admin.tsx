"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/component/ui/card"
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
  UserCheck,
  FileBarChart,
  UserMinus,
  ArrowLeft,
  Upload,
} from "lucide-react"
import BulkUpload from "./BulkUpload"

interface AdminPortalProps {
  onLogout: () => void
  onNavigate: (page: string) => void
  initialView?: 'overview' | 'approvals' | 'bulk-upload'
}

interface StaffMember {
  id: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt?: string
}

export function AdminPortal({ onLogout, onNavigate, initialView = 'overview' }: AdminPortalProps) {
  const [view, setView] = useState<'overview' | 'approvals' | 'bulk-upload'>(initialView)
  const [pendingStaff, setPendingStaff] = useState<StaffMember[]>([])

  const API_BASE = import.meta.env.VITE_API_URL

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setPendingStaff(data) : setPendingStaff([]))
      .catch(() => setPendingStaff([]))
  }, [view])

  const handleAction = async (id: string, endpoint: string, nextStatus: 'approved' | 'rejected' | 'pending') => {
    const token = localStorage.getItem("token")
    await fetch(`${API_BASE}/admin/${endpoint}/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
    setPendingStaff(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s))
  }

  const approvedCount = pendingStaff.filter(s => s.status === 'approved').length

  return (
    // Changed to h-screen and flex-col to fix scrolling
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-slate-800 text-white shadow-lg flex-shrink-0">
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
          <Button onClick={onLogout} className="bg-red-600 hover:bg-red-800 text-white">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      {/* Main scrollable area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {view === 'overview' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600">Manage staff access and system reports</p>
              </div>

              <Card className="border-blue-100 bg-blue-50/50 mb-6 w-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-xs font-bold uppercase tracking-wider">Total Faculty Working</p>
                    <p className="text-4xl font-black text-blue-900">{approvedCount}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600 opacity-20" />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:border-orange-500 transition-all group" onClick={() => setView('approvals')}>
                  <CardContent className="p-8 flex flex-col items-center">
                    <UserCheck className="w-10 h-10 text-orange-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Staff Approvals</h3>
                    <p className="text-xs text-gray-500">Manual signup requests</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-purple-500 transition-all group" onClick={() => setView('bulk-upload')}>
                  <CardContent className="p-8 flex flex-col items-center">
                    <Upload className="w-10 h-10 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Mass Staff Approval</h3>
                    <p className="text-xs text-gray-500">Excel Import (Auto-Create)</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-green-500 transition-all group" onClick={() => onNavigate('admin-reports')}>
                  <CardContent className="p-8 flex flex-col items-center">
                    <FileBarChart className="w-10 h-10 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">System Reports</h3>
                    <p className="text-xs text-gray-500">View analytics</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {view === 'approvals' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setView('overview')} className="text-gray-600">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">Staff Access Requests</h2>
              </div>
              
              {/* Added overflow container around the table */}
              <Card className="shadow-md border border-gray-200">
                <div className="max-h-[70vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="bg-gray-50">Staff Details</TableHead>
                        <TableHead className="bg-gray-50">Email</TableHead>
                        <TableHead className="bg-gray-50">Status</TableHead>
                        <TableHead className="text-center bg-gray-50">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingStaff.length > 0 ? (
                        pendingStaff.map((staff) => (
                          <TableRow key={staff.id}>
                            <TableCell className="font-medium">
                              {staff.name}
                              {staff.requestedAt && <p className="text-[10px] text-gray-400 font-normal">{staff.requestedAt}</p>}
                            </TableCell>
                            <TableCell>{staff.email}</TableCell>
                            <TableCell>
                              <Badge className={
                                staff.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                staff.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                                'bg-red-100 text-red-700'
                              }>
                                {staff.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                {staff.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(staff.id, 'approve', 'approved')}>Approve</Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(staff.id, 'revoke', 'rejected')}>Reject</Button>
                                  </>
                                )}
                                {staff.status === 'approved' && (
                                  <Button size="sm" variant="destructive" onClick={() => handleAction(staff.id, 'revoke', 'pending')} className="flex items-center">
                                    <UserMinus className="w-3 h-3 mr-2" /> Remove
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                            No staff records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {view === 'bulk-upload' && <BulkUpload onBack={() => setView('overview')} />}
        </div>
      </main>
    </div>
  )
}