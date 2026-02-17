"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Save, RotateCcw, Settings, Building2 } from "lucide-react";

interface RoomConfig {
  roomId: string;
  blockName: string;
  rows: number;
  columns: number;
  totalCapacity: number;
}

// Mock data — in the future, fetch from room-config page
const mockRooms: RoomConfig[] = [
  {
    roomId: "R-101",
    blockName: "Block A",
    rows: 6,
    columns: 5,
    totalCapacity: 30,
  },
  {
    roomId: "R-102",
    blockName: "Block A",
    rows: 5,
    columns: 5,
    totalCapacity: 25,
  },
  {
    roomId: "R-201",
    blockName: "Block B",
    rows: 7,
    columns: 5,
    totalCapacity: 35,
  },
  {
    roomId: "R-202",
    blockName: "Block B",
    rows: 6,
    columns: 4,
    totalCapacity: 24,
  },
  {
    roomId: "R-301",
    blockName: "Block C",
    rows: 8,
    columns: 5,
    totalCapacity: 40,
  },
  {
    roomId: "R-302",
    blockName: "Block C",
    rows: 6,
    columns: 6,
    totalCapacity: 36,
  },
];

export function Configurations() {
  const [useRoomBased, setUseRoomBased] = useState(false);

  const [config, setConfig] = useState({
    defaultRows: 6,
    defaultColumns: 5,
    maxCapacity: 30,
  });

  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>(mockRooms);

  const handleRoomConfigChange = (
    roomId: string,
    field: "rows" | "columns" | "totalCapacity",
    value: number,
  ) => {
    setRoomConfigs((prev) =>
      prev.map((room) => {
        if (room.roomId !== roomId) return room;
        const updated = { ...room, [field]: value };
        if (field === "rows" || field === "columns") {
          updated.totalCapacity = updated.rows * updated.columns;
        }
        return updated;
      }),
    );
  };

  const handleSave = () => {
    if (useRoomBased) {
      console.log("Room-based configuration saved:", roomConfigs);
    } else {
      console.log("Default configuration saved:", config);
    }
  };

  const handleReset = () => {
    setConfig({
      defaultRows: 6,
      defaultColumns: 5,
      maxCapacity: 30,
    });
    setRoomConfigs(mockRooms);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            System Configuration
          </h1>
          <p className="text-muted-foreground">
            Configure default settings for the examination system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Configuration Mode Toggle */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                Room-Based Configuration
              </p>
              <p className="text-sm text-muted-foreground">
                {useRoomBased
                  ? "Configure rows, columns & capacity per room individually"
                  : "Using a common default configuration for all rooms"}
              </p>
            </div>
          </div>
          <Switch checked={useRoomBased} onCheckedChange={setUseRoomBased} />
        </CardContent>
      </Card>

      {!useRoomBased ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Default Room Matrix Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Room Matrix Settings
              </CardTitle>
              <CardDescription>
                Configure default room dimensions and capacity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultRows">Default Rows</Label>
                  <Input
                    id="defaultRows"
                    type="number"
                    value={config.defaultRows}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultRows: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultColumns">Default Columns</Label>
                  <Input
                    id="defaultColumns"
                    type="number"
                    value={config.defaultColumns}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultColumns: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Max Capacity per Room</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  value={config.maxCapacity}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxCapacity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Default Matrix:{" "}
                  <strong className="text-foreground">
                    {config.defaultRows} × {config.defaultColumns}
                  </strong>{" "}
                  = {config.defaultRows * config.defaultColumns} seats
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Room-Based Configuration
            </CardTitle>
            <CardDescription>
              Configure dimensions and capacity for each room individually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room ID</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead className="w-[100px]">Rows</TableHead>
                    <TableHead className="w-[100px]">Columns</TableHead>
                    <TableHead className="w-[120px]">Total Capacity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomConfigs.map((room) => (
                    <TableRow key={room.roomId}>
                      <TableCell className="font-medium">
                        {room.roomId}
                      </TableCell>
                      <TableCell>{room.blockName}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={room.rows}
                          className="h-8 w-20"
                          onChange={(e) =>
                            handleRoomConfigChange(
                              room.roomId,
                              "rows",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={room.columns}
                          className="h-8 w-20"
                          onChange={(e) =>
                            handleRoomConfigChange(
                              room.roomId,
                              "columns",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {room.totalCapacity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-muted p-3 rounded-lg mt-4">
              <p className="text-sm text-muted-foreground">
                Total Rooms:{" "}
                <strong className="text-foreground">
                  {roomConfigs.length}
                </strong>
                {" · "}Total Seats:{" "}
                <strong className="text-foreground">
                  {roomConfigs.reduce((sum, r) => sum + r.totalCapacity, 0)}
                </strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
