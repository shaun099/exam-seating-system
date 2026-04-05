"use client";

import { useState, useEffect } from "react";
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
import { Save, RotateCcw, Settings, Building2, Loader2 } from "lucide-react";

const ROOMS_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/v1/upload/rooms`;
const ROOMS_BULK_UPDATE_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/v1/upload/rooms/bulk-update`;
const SEATING_DEFAULTS_STORAGE_KEY = "seating-default-matrix";
const ROOM_CONFIG_MODE_KEY = "room-config-mode"; // "default" | "room-based"
const ROOM_BASED_MAP_KEY = "room-based-map"; // {[roomId: number]: {rows, cols}}

interface RoomConfig {
  id: number;
  room_number: string;
  rows: number;
  cols: number;
  capacity: number;
}

interface SeatingDefaultMatrix {
  rows: number;
  cols: number;
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getSavedSeatingDefaults = (): SeatingDefaultMatrix => {
  const fallback = { rows: 6, cols: 5 };
  try {
    const raw = localStorage.getItem(SEATING_DEFAULTS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SeatingDefaultMatrix>;
    const rows = Number(parsed.rows);
    const cols = Number(parsed.cols);
    return {
      rows: Number.isFinite(rows) && rows > 0 ? rows : fallback.rows,
      cols: Number.isFinite(cols) && cols > 0 ? cols : fallback.cols,
    };
  } catch {
    return fallback;
  }
};

export function Configurations() {
  const savedDefaults = getSavedSeatingDefaults();

  const [useRoomBased, setUseRoomBased] = useState(false);
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([]);
  const [originalRoomConfigs, setOriginalRoomConfigs] = useState<RoomConfig[]>(
    [],
  );
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [config, setConfig] = useState({
    defaultRows: savedDefaults.rows,
    defaultColumns: savedDefaults.cols,
  });

  const fetchRooms = async () => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const res = await fetch(ROOMS_ENDPOINT, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      const rooms: RoomConfig[] = Array.isArray(data) ? data : data.data || []; // ← fix
      setRoomConfigs(rooms);
      setOriginalRoomConfigs(rooms);
    } catch (err) {
      setRoomsError("Failed to load rooms. Please try again.");
    } finally {
      setRoomsLoading(false);
    }
  };

  // Fetch rooms when switching to room-based mode
  useEffect(() => {
    if (useRoomBased && roomConfigs.length === 0) {
      void fetchRooms();
    }
  }, [useRoomBased]);

  const handleRoomConfigChange = (
    id: number,
    field: "rows" | "cols",
    value: number,
  ) => {
    setRoomConfigs((prev) =>
      prev.map((room) =>
        room.id === id
          ? {
              ...room,
              [field]: value,
              capacity:
                field === "rows" ? value * room.cols : room.rows * value,
            }
          : room,
      ),
    );
  };

  const handleSaveDefault = () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      localStorage.setItem(
        SEATING_DEFAULTS_STORAGE_KEY,
        JSON.stringify({
          rows: config.defaultRows,
          cols: config.defaultColumns,
        }),
      );
      localStorage.setItem(ROOM_CONFIG_MODE_KEY, "default"); // ← add this
      setSaveMessage("Default settings saved successfully.");
    } catch (err) {
      setSaveMessage("Failed to save default settings.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSaveRoomBased = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(ROOMS_BULK_UPDATE_ENDPOINT, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          rooms: roomConfigs.map((r) => ({
            id: r.id,
            rows: r.rows,
            cols: r.cols,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setOriginalRoomConfigs(roomConfigs);

      // ← Save mode and map to localStorage
      localStorage.setItem(ROOM_CONFIG_MODE_KEY, "room-based");
      const map = Object.fromEntries(
        roomConfigs.map((r) => [r.id, { rows: r.rows, cols: r.cols }]),
      );
      localStorage.setItem(ROOM_BASED_MAP_KEY, JSON.stringify(map));

      setSaveMessage("Room configurations saved successfully.");
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Failed to save rooms.",
      );
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };
  const handleReset = () => {
    if (useRoomBased) {
      setRoomConfigs(originalRoomConfigs);
    } else {
      setConfig({ defaultRows: 6, defaultColumns: 5 });
    }
  };

  const handleSave = () => {
    if (useRoomBased) {
      void handleSaveRoomBased();
    } else {
      handleSaveDefault();
    }
  };

  const isDirty = useRoomBased
    ? JSON.stringify(roomConfigs) !== JSON.stringify(originalRoomConfigs)
    : config.defaultRows !== savedDefaults.rows ||
      config.defaultColumns !== savedDefaults.cols;

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
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-sm text-emerald-600 font-medium">
              {saveMessage}
            </span>
          )}
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isDirty}
            className="bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Toggle */}
      <Card className="hidden">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium text-foreground">
              Room-Based Configuration
            </p>
            <p className="text-sm text-muted-foreground">
              {useRoomBased
                ? "Configure rows and columns per room individually"
                : "Using a common default configuration for all rooms"}
            </p>
          </div>
          <Switch checked={useRoomBased} onCheckedChange={setUseRoomBased} />
        </CardContent>
      </Card>

      {!useRoomBased ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Room Matrix Settings
              </CardTitle>
              <CardDescription>
                Configure default room dimensions applied to all rooms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultRows">Default Rows</Label>
                  <Input
                    id="defaultRows"
                    type="number"
                    min={1}
                    value={config.defaultRows}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultRows: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultColumns">Default Columns</Label>
                  <Input
                    id="defaultColumns"
                    type="number"
                    min={1}
                    value={config.defaultColumns}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultColumns: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
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
              Configure rows and columns for each room individually
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading rooms...
              </div>
            ) : roomsError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
                <p>{roomsError}</p>
                <Button variant="outline" onClick={fetchRooms}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead className="w-[120px]">Rows</TableHead>
                        <TableHead className="w-[120px]">Columns</TableHead>
                        <TableHead className="w-[120px]">Capacity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roomConfigs.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">
                            {room.room_number}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={room.rows}
                              className="h-8 w-20"
                              onChange={(e) =>
                                handleRoomConfigChange(
                                  room.id,
                                  "rows",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={room.cols}
                              className="h-8 w-20"
                              onChange={(e) =>
                                handleRoomConfigChange(
                                  room.id,
                                  "cols",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {room.rows * room.cols}
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
                      {roomConfigs.reduce((sum, r) => sum + r.rows * r.cols, 0)}
                    </strong>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
