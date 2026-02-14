
"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pencil,
  Trash2,
  Plus,
  Building2,
  Users,
  LayoutGrid,
  Upload,
  FileSpreadsheet
  
} from "lucide-react";
import { RoomDetails } from "@/App/roomdetails";

interface RoomRecord {
  id: string;
  roomId: string;
  blockName: string;
  rows: number;
  columns: number;
  capacity: number;
}

export function RoomConfig() {
  const [rooms, setRooms] = useState<RoomRecord[]>([
    {
      id: "1",
      roomId: "R001",
      blockName: "Block A",
      rows: 6,
      columns: 5,
      capacity: 30
    },
    {
      id: "2",
      roomId: "R002",
      blockName: "Block A",
      rows: 6,
      columns: 5,
      capacity: 30
    },
    {
      id: "3",
      roomId: "R003",
      blockName: "Block B",
      rows: 5,
      columns: 6,
      capacity: 30
    },
    {
      id: "4",
      roomId: "R004",
      blockName: "Block B",
      rows: 6,
      columns: 5,
      capacity: 30
    },
    {
      id: "5",
      roomId: "R005",
      blockName: "Block C",
      rows: 8,
      columns: 4,
      capacity: 32
    },
    {
      id: "6",
      roomId: "R006",
      blockName: "Block C",
      rows: 6,
      columns: 5,
      capacity: 30
    },
    {
      id: "7",
      roomId: "R007",
      blockName: "Block D",
      rows: 5,
      columns: 5,
      capacity: 25
    },
    {
      id: "8",
      roomId: "R008",
      blockName: "Block D",
      rows: 6,
      columns: 6,
      capacity: 36
    }
  ]);

  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate statistics
  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const avgPerRoom = totalRooms > 0 ? Math.round(totalCapacity / totalRooms) : 0;

  const handleEditRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
      setShowRoomDetails(true);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      setRooms(rooms.filter(room => room.id !== roomId));
    }
  };

  const handleAddNewRoom = () => {
    const newRoom: RoomRecord = {
      id: `${Date.now()}`,
      roomId: `R${String(rooms.length + 1).padStart(3, '0')}`,
      blockName: "New Block",
      rows: 6,
      columns: 5,
      capacity: 30
    };
    setSelectedRoom(newRoom);
    setShowRoomDetails(true);
  };

  const handleImportCSV = () => {
    setShowUploadModal(true);
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert("Please upload a valid CSV file");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File size exceeds 5MB limit");
      return;
    }

    setUploadedFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const records: RoomRecord[] = [];

        // Expected format: Room ID, Block Name, Rows, Columns, Capacity
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const [roomId, blockName, rows, columns, capacity] = line.split(",");
            
            if (!roomId || !blockName || !rows || !columns || !capacity) {
              continue;
            }

            records.push({
              id: `csv_${Date.now()}_${i}`,
              roomId: roomId.trim(),
              blockName: blockName.trim(),
              rows: parseInt(rows) || 6,
              columns: parseInt(columns) || 5,
              capacity: parseInt(capacity) || 30,
            });
          }
        }

        if (records.length === 0) {
          alert("No valid data found in CSV file");
          return;
        }

        setRooms(records);
        setShowUploadModal(false);
        setUploadedFile(null);
        alert(`Successfully imported ${records.length} rooms!`);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        alert("Error reading CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSaveRoomDetails = (updatedRoom: { 
    id: string; 
    hallName?: string; 
    building?: string; 
    capacity?: number 
  }) => {
    const existingRoom = rooms.find(r => r.id === updatedRoom.id);
    
    if (existingRoom) {
      setRooms(rooms.map(room => 
        room.id === updatedRoom.id ? {
          ...room,
          roomId: updatedRoom.hallName || room.roomId,
          blockName: updatedRoom.building || room.blockName,
          capacity: updatedRoom.capacity || room.capacity
        } : room
      ));
    } else {
      setRooms([...rooms, {
        id: updatedRoom.id || `${Date.now()}`,
        roomId: updatedRoom.hallName || `R${String(rooms.length + 1).padStart(3, '0')}`,
        blockName: updatedRoom.building || "New Block",
        rows: 6,
        columns: 5,
        capacity: updatedRoom.capacity || 30
      }]);
    }
    
    setShowRoomDetails(false);
    setSelectedRoom(null);
  };

  const handleBackFromDetails = () => {
    setShowRoomDetails(false);
    setSelectedRoom(null);
  };

  // If showing room details page
  if (showRoomDetails && selectedRoom) {
    return (
      <RoomDetails
        hallId={selectedRoom.id}
        hallName={selectedRoom.roomId}
        capacity={selectedRoom.capacity}
        building={selectedRoom.blockName}
        onSave={handleSaveRoomDetails}
        onBack={handleBackFromDetails}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Room Configuration
          </h1>
          <p className="text-gray-600 mt-1">
            Manage examination rooms and their seating capacity
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleImportCSV}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            onClick={handleAddNewRoom}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Room
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rooms</p>
                <p className="text-3xl font-bold text-gray-900">{totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-3xl font-bold text-gray-900">{totalCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. per Room</p>
                <p className="text-3xl font-bold text-gray-900">{avgPerRoom}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Rooms Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Rooms</h2>
          
          {/* Scrollable container with max height */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Room ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Block Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rows</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Columns</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Capacity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, index) => (
                  <tr
                    key={room.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">{room.roomId}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{room.blockName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{room.rows}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{room.columns}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{room.capacity}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRoom(room.id)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Edit Room"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          title="Delete Room"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rooms.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-900 font-medium">No rooms configured</p>
              <p className="text-sm text-gray-600 mt-1">
                Click "Add New Room" to create your first room
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Import Rooms from CSV</h3>
              <p className="text-sm text-gray-600 mt-1">Upload a CSV file with room data</p>
            </div>

            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {isDragging ? "Drop your CSV file here" : "Drag and drop CSV file here"}
                </p>
                <p className="text-xs text-gray-600">or click to browse</p>
                <p className="text-xs text-gray-500 mt-2">Max file size: 5MB</p>
              </div>

              {uploadedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                    <p className="text-xs text-green-700">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">Expected CSV Format:</p>
                <code className="text-xs text-blue-700 block bg-white p-2 rounded mt-2">
                  Room ID, Block Name, Rows, Columns, Capacity<br/>
                  R001, Block A, 6, 5, 30<br/>
                  R002, Block B, 5, 6, 30
                </code>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

