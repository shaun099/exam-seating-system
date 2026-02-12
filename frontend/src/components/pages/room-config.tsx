"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Building2 } from "lucide-react"

interface Room {
  id: string
  blockName: string
  rows: number
  columns: number
  capacity: number
}

const initialRooms: Room[] = [
  { id: "R001", blockName: "Block A", rows: 6, columns: 5, capacity: 30 },
  { id: "R002", blockName: "Block A", rows: 6, columns: 5, capacity: 30 },
  { id: "R003", blockName: "Block B", rows: 5, columns: 6, capacity: 30 },
  { id: "R004", blockName: "Block B", rows: 6, columns: 5, capacity: 30 },
  { id: "R005", blockName: "Block C", rows: 8, columns: 4, capacity: 32 },
  { id: "R006", blockName: "Block C", rows: 6, columns: 5, capacity: 30 },
  { id: "R007", blockName: "Block D", rows: 5, columns: 5, capacity: 25 },
  { id: "R008", blockName: "Block D", rows: 6, columns: 6, capacity: 36 },
]

export function RoomConfig() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  // eslint-disable-next-line no-empty-pattern
  const [] = useState<Room | null>(null)
  const [newRoom, setNewRoom] = useState({
    id: "",
    blockName: "",
    rows: 6,
    columns: 5,
  })

  const handleAddRoom = () => {
    const room: Room = {
      ...newRoom,
      capacity: newRoom.rows * newRoom.columns,
    }
    setRooms([...rooms, room])
    setNewRoom({ id: "", blockName: "", rows: 6, columns: 5 })
    setIsAddDialogOpen(false)
  }

  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id))
  }

  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Room Configuration</h1>
          <p className="text-muted-foreground">Manage examination rooms and their seating capacity</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  placeholder="e.g., R009"
                  value={newRoom.id}
                  onChange={(e) => setNewRoom({ ...newRoom, id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blockName">Block Name</Label>
                <Input
                  id="blockName"
                  placeholder="e.g., Block A"
                  value={newRoom.blockName}
                  onChange={(e) => setNewRoom({ ...newRoom, blockName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    value={newRoom.rows}
                    onChange={(e) => setNewRoom({ ...newRoom, rows: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="columns">Columns</Label>
                  <Input
                    id="columns"
                    type="number"
                    value={newRoom.columns}
                    onChange={(e) => setNewRoom({ ...newRoom, columns: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Calculated Capacity: <strong className="text-foreground">{newRoom.rows * newRoom.columns}</strong> seats
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRoom} disabled={!newRoom.id || !newRoom.blockName}>
                  Add Room
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold text-foreground">{rooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-foreground">{totalCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. per Room</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(totalCapacity / rooms.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room ID</TableHead>
                <TableHead>Block Name</TableHead>
                <TableHead className="text-center">Rows</TableHead>
                <TableHead className="text-center">Columns</TableHead>
                <TableHead className="text-center">Total Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.id}</TableCell>
                  <TableCell>{room.blockName}</TableCell>
                  <TableCell className="text-center">{room.rows}</TableCell>
                  <TableCell className="text-center">{room.columns}</TableCell>
                  <TableCell className="text-center font-medium">{room.capacity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
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
