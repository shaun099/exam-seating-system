"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Building2 } from "lucide-react";

export interface RoomDetailsProps {
  hallId: string;
  hallName: string;
  capacity: number;
  building: string;
  onSave: (updatedHall: { id: string; hallName: string; capacity: number; building: string }) => void;
  onBack: () => void;
}

export function RoomDetails({ 
  hallId, 
  hallName, 
  capacity, 
  building, 
  onSave, 
  onBack 
}: RoomDetailsProps) {
  const [editedHall, setEditedHall] = useState({
    id: hallId,
    hallName: hallName,
    capacity: capacity,
    building: building,
  });

  const handleSave = () => {
    onSave(editedHall);
    alert("Room details saved successfully!");
  };

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-gray-50">
      <div className="space-y-6 p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-blue-900">Room Details</h1>
          <p className="text-blue-700 mt-1">{hallName}</p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Room Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-200 shadow-lg lg:col-span-2">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Building2 className="w-5 h-5 text-blue-600" />
              Edit Room Information
            </CardTitle>
            <CardDescription className="text-blue-700">
              Update the details for this examination hall
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hall Name */}
              <div className="space-y-2">
                <Label htmlFor="hallName" className="text-blue-900 font-medium">
                  Hall Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hallName"
                  value={editedHall.hallName}
                  onChange={(e) =>
                    setEditedHall({ ...editedHall, hallName: e.target.value })
                  }
                  placeholder="Enter hall name"
                  className="border-blue-300 focus:border-blue-500"
                />
              </div>

              {/* Building */}
              <div className="space-y-2">
                <Label htmlFor="building" className="text-blue-900 font-medium">
                  Building <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="building"
                  value={editedHall.building}
                  onChange={(e) =>
                    setEditedHall({ ...editedHall, building: e.target.value })
                  }
                  placeholder="Enter building name"
                  className="border-blue-300 focus:border-blue-500"
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-blue-900 font-medium">
                  Seating Capacity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="500"
                  value={editedHall.capacity}
                  onChange={(e) =>
                    setEditedHall({
                      ...editedHall,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter capacity"
                  className="border-blue-300 focus:border-blue-500"
                />
              </div>

              {/* Room ID (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="roomId" className="text-blue-900 font-medium">
                  Room ID
                </Label>
                <Input
                  id="roomId"
                  value={hallId}
                  disabled
                  className="border-blue-300 bg-blue-50 text-blue-700"
                />
              </div>
            </div>

            {/* Summary Card */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Room Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Hall Name</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    {editedHall.hallName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Building</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    {editedHall.building || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">
                    Total Capacity
                  </p>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    {editedHall.capacity} seats
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg text-blue-900">
              Room Guidelines
            </CardTitle>
            <CardDescription className="text-blue-700">
              Important information about room configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Ensure the hall name is unique and easily identifiable
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Capacity should reflect actual seating with proper spacing
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Building name helps in organizing examination schedules
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  All fields marked with <span className="text-red-500">*</span>{" "}
                  are required
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg text-blue-900">
              Quick Stats
            </CardTitle>
            <CardDescription className="text-blue-700">
              Current room statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Status</p>
                <p className="text-xl font-bold text-green-600 mt-1">Active</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 font-medium">
                  Seating Capacity
                </p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {editedHall.capacity}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">
                  Last Modified
                </p>
                <p className="text-sm font-medium text-blue-900 mt-1">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}