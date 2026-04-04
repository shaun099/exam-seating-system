"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/component/ui/card";
import { Button } from "@/component/ui/button";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { RoomDetails } from "./roomdetails";

interface RoomRecord {
  id: string;
  roomId: string;
  blockName: string;
  rows: number;
  columns: number;
  capacity: number;
}

interface ApiRoom {
  id: number;
  room_number: string;
  rows: number;
  cols: number;
}

export default function RoomConfig() {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ✅ FETCH ROOMS
  const fetchRooms = async (): Promise<RoomRecord[]> => {
    const res = await fetch("http://127.0.0.1:8000/api/v1/upload/rooms");
    const data: ApiRoom[] = await res.json();

    return data
      .sort((a, b) => a.id - b.id)   // 🔥 FIX (VERY IMPORTANT)
      .map((room) => ({
        id: room.id.toString(),
        roomId: room.room_number,
        blockName: "Block",
        rows: room.rows,
        columns: room.cols,
        capacity: room.rows * room.cols,
      }));
  };

  const refreshRooms = async () => {
    const formatted = await fetchRooms();
    setRooms(formatted);
  };

  useEffect(() => {
    const loadRooms = async () => {
      const formatted = await fetchRooms();
      setRooms(formatted);
    };

    void loadRooms();
  }, []);

  // 🔍 SEARCH
  const filteredRooms = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return rooms.filter((room) =>
      room.roomId.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, rooms]);

  // 📊 STATS
  const totalRooms = filteredRooms.length;
  const totalCapacity = filteredRooms.reduce((sum, r) => sum + r.capacity, 0);
  const avgPerRoom = totalRooms
    ? Math.round(totalCapacity / totalRooms)
    : 0;

  // 📥 CSV UPLOAD
  const handleFileSelect = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://127.0.0.1:8000/api/v1/upload/rooms", {
      method: "POST",
      body: formData,
    });

    alert("CSV uploaded ✅");
    refreshRooms();
  };

  // ✏️ EDIT
  const handleEditRoom = (id: string) => {
    const room = rooms.find((r) => r.id === id);
    if (room) {
      setSelectedRoom(room);
      setShowRoomDetails(true);
    }
  };

  // 🗑️ DELETE
  const handleDeleteRoom = async (roomId: string) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this room?");

  if (!confirmDelete) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/v1/upload/rooms/${Number(roomId)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      alert("Failed to delete room ❌");
      return;
    }

    alert("Room deleted successfully ✅");

    await refreshRooms();

  } catch (err) {
    console.error(err);
    alert("Error deleting room ❌");
  }
};
     
  // ➕ ADD
  const handleAddNewRoom = () => {
    setSelectedRoom({
      id: "",
      roomId: "",
      blockName: "",
      rows: 6,
      columns: 5,
      capacity: 30,
    });
    setShowRoomDetails(true);
  };

  // 💾 SAVE
  const handleSaveRoomDetails = async (updatedRoom: any) => {
  try {
    const payload = {
      room_number: (updatedRoom.hallName || "").trim(),
      rows: Number(updatedRoom.rows) || 0,
      columns: Number(updatedRoom.columns) || 0
    };

    if (!payload.room_number) {
      alert("Room name required ❌");
      return;
    }

    if (payload.rows <= 0 || payload.columns <= 0) {
      alert("Rows & Columns must be > 0 ❌");
      return;
    }

    let res;

    // 🔥 ✅ CHECK: EDIT OR CREATE
    if (updatedRoom.id) {
      // ✏️ UPDATE
      res = await fetch(
        `http://127.0.0.1:8000/api/v1/upload/rooms/${updatedRoom.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );
    } else {
      // ➕ CREATE
      res = await fetch(
        "http://127.0.0.1:8000/api/v1/upload/rooms/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );
    }

    if (!res.ok) {
      const errTEXT = await res.text();
      console.error("API ERROR:", errTEXT);
      alert(errTEXT);
      return;
    }

    alert(updatedRoom.id ? "Room updated successfully ✅" : "Room added successfully ✅");

    await refreshRooms(); // 🔥 IMPORTANT: reload from DB

    setShowRoomDetails(false);
    setSelectedRoom(null);

  } catch (err) {
    console.error(err);
    alert("Something went wrong ❌");
  }
};




  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  // 🔄 NAVIGATION
  if (showRoomDetails && selectedRoom) {
    return (
      <RoomDetails
        hallId={selectedRoom.id}
        hallName={selectedRoom.roomId}
        capacity={selectedRoom.capacity}
        building={selectedRoom.blockName}
        onSave={handleSaveRoomDetails}
        onBack={() => {
          setShowRoomDetails(false);
          setSelectedRoom(null);
        }}
      />
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12">
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Room Configuration</h1>

          <div className="flex gap-2">
            <Button onClick={() => fileInputRef.current?.click()}>
              Import CSV
            </Button>

            <Button onClick={handleAddNewRoom}>
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </div>
        </div>

        {/* FILE INPUT */}
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept=".csv"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {/* SEARCH BAR */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Rooms</div>
              <div className="text-3xl font-bold text-gray-900">{totalRooms}</div>
              {searchTerm && rooms.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  of {rooms.length} total
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Capacity</div>
              <div className="text-3xl font-bold text-gray-900">{totalCapacity}</div>
              {searchTerm && rooms.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  of {rooms.reduce((sum, r) => sum + r.capacity, 0)} total
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Average per Room</div>
              <div className="text-3xl font-bold text-gray-900">{avgPerRoom}</div>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Room</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Rows</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Cols</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Capacity</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-gray-900">{room.roomId}</td>
                    <td className="p-4 text-gray-900">{room.rows}</td>
                    <td className="p-4 text-gray-900">{room.columns}</td>
                    <td className="p-4 text-gray-900">{room.capacity}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRoom(room.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          aria-label="Edit room"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRooms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? (
                  <div>
                    <p>No rooms found matching "{searchTerm}"</p>
                    <button
                      onClick={clearSearch}
                      className="mt-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <p>No rooms configured yet. Click "Add Room" or "Import CSV" to get started.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}