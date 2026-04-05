const SEATING_DEFAULTS_STORAGE_KEY = "seating-default-matrix";
const ROOM_CONFIG_MODE_KEY = "room-config-mode";
const ROOM_BASED_MAP_KEY = "room-based-map";

export type RoomConfigMode = "default" | "room-based";

export interface RoomMatrixEntry {
  rows: number;
  cols: number;
}

export const getRoomConfigMode = (): RoomConfigMode => {
  return (localStorage.getItem(ROOM_CONFIG_MODE_KEY) as RoomConfigMode) || "default";
};

export const getDefaultMatrix = (): RoomMatrixEntry => {
  const fallback = { rows: 6, cols: 5 };
  try {
    const raw = localStorage.getItem(SEATING_DEFAULTS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
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

export const getRoomBasedMap = (): Record<number, RoomMatrixEntry> => {
  try {
    const raw = localStorage.getItem(ROOM_BASED_MAP_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

// Main function allocation page will call
export const getMatrixForRoom = (roomId: number): RoomMatrixEntry => {
  const mode = getRoomConfigMode();
  if (mode === "room-based") {
    const map = getRoomBasedMap();
    if (map[roomId]) return map[roomId];
  }
  return getDefaultMatrix();
};