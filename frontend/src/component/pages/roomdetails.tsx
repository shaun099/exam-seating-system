"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/component/ui/card";
import { Button } from "@/component/ui/button";
import { Input } from "@/component/ui/input";
import { Label } from "@/component/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/component/ui/tabs";
import { Save, ArrowLeft, Building2, Grid3X3, Users } from "lucide-react";

export interface RoomDetailsProps {
  hallId: string;
  hallName: string;
  capacity: number;
  building: string;
  initialRows?: number;
  initialCols?: number;
  initialRowConfigs?: number[];
  onSave: (updatedProfile: any) => void;
  onBack: () => void;
}

export function RoomDetails({ 
  hallId, 
  hallName, 
  capacity, 
  building, 
  initialRows = 6,
  initialCols = 5,
  initialRowConfigs,
  onSave, 
  onBack 
}: RoomDetailsProps) {

  const [activeTab, setActiveTab] = useState("internal");

  const [editedHall, setEditedHall] = useState({
    id: hallId,
    hallName: hallName,
    building: building,
    universityCapacity: 30,
    rows: initialRows,
    cols: initialCols,
    rowConfigs: initialRowConfigs || Array(initialRows).fill(initialCols),
    totalInternalCapacity: capacity,
  });

  useEffect(() => {
    const total = editedHall.rowConfigs.reduce((a, b) => a + b, 0);
    setEditedHall(prev => ({ ...prev, totalInternalCapacity: total }));
  }, [editedHall.rowConfigs]);

  const handleRowChange = (count: string) => {
    const newRowCount = Math.max(1, parseInt(count) || 1);
    const newConfigs = Array(newRowCount).fill(editedHall.cols);

    editedHall.rowConfigs.forEach((val, idx) => {
      if (idx < newRowCount) newConfigs[idx] = val;
    });

    setEditedHall({ ...editedHall, rows: newRowCount, rowConfigs: newConfigs });
  };

  const updateSingleRow = (index: number, val: string) => {
    const updated = [...editedHall.rowConfigs];
    updated[index] = parseInt(val) || 0;
    setEditedHall({ ...editedHall, rowConfigs: updated });
  };

  const handleSave = () => {
    onSave({
      id: editedHall.id,
      hallName: editedHall.hallName,
      building: editedHall.building,
      universityMode: { rows: 6, cols: 5, capacity: 30 },
      internalProfile: {
        rows: editedHall.rows,
        cols: editedHall.cols,
        rowConfigs: editedHall.rowConfigs,
        capacity: editedHall.totalInternalCapacity
      }
    });

    alert(`Profile for ${editedHall.hallName} updated!`);
  };

  return (
    <div className="fixed top-16 left-64 right-0 bottom-0 bg-gray-50 flex flex-col overflow-hidden">

      <main className="flex-1 overflow-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 p-6 pb-40">

          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 py-2">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onBack}
                className="border-blue-600 text-blue-600 bg-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">
                  Room Profile
                </h1>
                <p className="text-blue-600 text-sm">
                  {editedHall.hallName} • {editedHall.building}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              <Save className="w-4 h-4 mr-2" /> Save Profile
            </Button>
          </div>

          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-blue-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Configuration Profiles
                  </CardTitle>
                  <CardDescription>
                    Setup room behavior for different exam modes
                  </CardDescription>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full md:w-[300px]"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-blue-100">
                    <TabsTrigger value="university">
                      University
                    </TabsTrigger>
                    <TabsTrigger value="internal">
                      Internal
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">
                    Hall Name
                  </Label>
                  <Input
                    value={editedHall.hallName}
                    onChange={(e) =>
                      setEditedHall({
                        ...editedHall,
                        hallName: e.target.value,
                      })
                    }
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">
                    Building
                  </Label>
                  <Input
                    value={editedHall.building}
                    onChange={(e) =>
                      setEditedHall({
                        ...editedHall,
                        building: e.target.value,
                      })
                    }
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>
              </div>

              <hr className="border-blue-100" />

              {activeTab === "university" ? (
                <div className="bg-blue-50/50 p-6 rounded-xl border border-dashed border-blue-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="text-blue-600" />
                    <h3 className="font-bold text-blue-900">
                      Standard University Profile
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm text-center">
                      <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">
                        Rows
                      </p>
                      <p className="text-xl font-bold text-blue-900">6</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm text-center">
                      <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">
                        Cols
                      </p>
                      <p className="text-xl font-bold text-blue-900">5</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm text-center">
                      <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">
                        Capacity
                      </p>
                      <p className="text-xl font-bold text-emerald-600">30</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Grid3X3 className="text-blue-600" />
                    <h3 className="font-bold text-blue-900">
                      Internal Exam Capacity
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div className="space-y-2">
                      <Label className="font-semibold">
                        Number of Rows
                      </Label>
                      <Input
                        type="number"
                        value={editedHall.rows}
                        onChange={(e) =>
                          handleRowChange(e.target.value)
                        }
                        className="border-blue-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">
                        Columns per Row
                      </Label>
                      <Input
                        type="number"
                        value={editedHall.cols}
                        onChange={(e) =>
                          setEditedHall({
                            ...editedHall,
                            cols: parseInt(e.target.value) || 0,
                          })
                        }
                        className="border-blue-200"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <Label className="text-blue-900 block mb-4 font-bold italic">
                      Fine-tune Capacity (Seats per Row)
                    </Label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {editedHall.rowConfigs.map((cap, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-white p-2 rounded-md border border-blue-100 shadow-sm"
                        >
                          <span className="text-xs font-bold text-blue-500 w-10">
                            R-{idx + 1}
                          </span>
                          <Input
                            type="number"
                            value={cap}
                            className="h-8 w-16 border-none bg-blue-50/50 text-center font-bold"
                            onChange={(e) =>
                              updateSingleRow(idx, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 mt-6 flex items-center justify-between p-5 bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl text-white shadow-xl">
                <div>
                  <p className="text-blue-300 text-[10px] uppercase font-bold tracking-widest">
                    Calculated Seating
                  </p>
                  <p className="text-3xl font-black">
                    {activeTab === "university"
                      ? editedHall.universityCapacity
                      : editedHall.totalInternalCapacity}
                    <span className="text-sm font-normal ml-2 text-blue-200">
                      Students
                    </span>
                  </p>
                </div>

                <div className="text-right border-l border-blue-700 pl-6">
                  <p className="text-blue-300 text-[10px] uppercase font-bold">
                    Active Layout
                  </p>
                  <p className="font-bold text-lg">
                    {activeTab === "university"
                      ? "6 × 5 Standard"
                      : `${editedHall.rows} Custom Rows`}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}