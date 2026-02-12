"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, Search, Users, UserCheck, UserX } from "lucide-react"

interface Faculty {
  id: string
  name: string
  department: string
  available: boolean
}

const initialFaculty: Faculty[] = [
  { id: "F001", name: "Dr. Anil Kumar", department: "Computer Science", available: true },
  { id: "F002", name: "Prof. Lakshmi Nair", department: "Electronics", available: true },
  { id: "F003", name: "Dr. Rajesh Menon", department: "Mechanical", available: false },
  { id: "F004", name: "Prof. Sneha Thomas", department: "Computer Science", available: true },
  { id: "F005", name: "Dr. Mohammed Basheer", department: "Civil", available: true },
  { id: "F006", name: "Prof. Anjali Das", department: "Electronics", available: false },
  { id: "F007", name: "Dr. Vishnu Pillai", department: "Computer Science", available: true },
  { id: "F008", name: "Prof. Priya Sharma", department: "Mechanical", available: true },
  { id: "F009", name: "Dr. Deepak Raj", department: "Civil", available: true },
  { id: "F010", name: "Prof. Kavitha Menon", department: "Electronics", available: true },
]

export function InvigilatorMgmt() {
  const [faculty, setFaculty] = useState<Faculty[]>(initialFaculty)
  const [searchQuery, setSearchQuery] = useState("")

  const handleToggleAvailability = (id: string) => {
    setFaculty(
      faculty.map((f) => (f.id === id ? { ...f, available: !f.available } : f))
    )
  }

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableCount = faculty.filter((f) => f.available).length
  const unavailableCount = faculty.filter((f) => !f.available).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invigilator Management</h1>
          <p className="text-muted-foreground">Manage faculty availability for examination duty</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Faculty List
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Faculty</p>
                <p className="text-2xl font-bold text-foreground">{faculty.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-foreground">{availableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unavailable</p>
                <p className="text-2xl font-bold text-foreground">{unavailableCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Faculty List</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculty.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.id}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={member.available ? "default" : "secondary"}
                      className={
                        member.available
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {member.available ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={member.available}
                      onCheckedChange={() => handleToggleAvailability(member.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
