"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ArrowLeft, Download, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeatCell { reg_no: string; student_name: string; course_code: string }
interface RoomPreview {
  room_id: number; room_number: string; rows: number; cols: number;
  event_name: string; courses: string[]; cells: Record<string, SeatCell>; total_count: number;
}
interface PreviewResponse { event_name: string; date: string; sem: string; slot: string; rooms: RoomPreview[] }

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const PREVIEW_ENDPOINT = `${API_BASE}/api/v1/download/classMatrix/preview`;
const REPLACE_ROOM_ENDPOINT = `${API_BASE}/api/v1/download/classMatrix/replace-room`;
const DOWNLOAD_ENDPOINT = `${API_BASE}/api/v1/download/classMatrix`;

const CC = [
  { h: "bg-blue-100 text-blue-800",    c: "bg-blue-50",    b: "bg-blue-100 text-blue-700" },
  { h: "bg-emerald-100 text-emerald-800", c: "bg-emerald-50", b: "bg-emerald-100 text-emerald-700" },
  { h: "bg-orange-100 text-orange-800",  c: "bg-orange-50",  b: "bg-orange-100 text-orange-700" },
  { h: "bg-rose-100 text-rose-800",    c: "bg-rose-50",    b: "bg-rose-100 text-rose-700" },
];

const colLabel = (i: number) => {
  let label = "", v = i + 1;
  while (v > 0) { label = String.fromCharCode(64 + (v % 26 || 26)) + label; v = Math.floor((v - 1) / 26); }
  return label;
};
const fmtCode = (c: string) => c.replace(/([A-Za-z]+)(\d+)/, "$1 $2");

// ── RoomGrid ──────────────────────────────────────────────────────────────────

function RoomGrid({ room }: { room: RoomPreview }) {
  const cMap = new Map(room.courses.map((c, i) => [c, CC[i % CC.length]]));

  let lastRow = -1;
  Object.keys(room.cells).forEach((k) => { const r = +k.split(",")[0]; if (r > lastRow) lastRow = r; });

  const colCourses = (ci: number) => {
    const seen: string[] = [];
    for (let r = 0; r <= lastRow; r++) {
      const code = room.cells[`${r},${ci}`]?.course_code;
      if (code && !seen.includes(code)) seen.push(code);
    }
    return seen;
  };

  return (
    <div className="max-h-[28rem] overflow-auto">
      <table className="border-collapse text-xs min-w-full w-max">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-2 py-1 min-w-[28px]" />
            {Array.from({ length: room.cols }, (_, ci) => (
              <th key={ci} className="border border-gray-300 bg-gray-100 px-2 py-1 text-center text-gray-600 min-w-[72px]">
                {colLabel(ci)}
              </th>
            ))}
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 px-2 py-1 text-center text-gray-400">↓</td>
            {Array.from({ length: room.cols }, (_, ci) => {
              const courses = colCourses(ci);
              return (
                <td key={ci} className={`border border-gray-300 px-1 py-1 text-center font-medium ${cMap.get(courses[0])?.h ?? "bg-gray-100 text-gray-700"}`}>
                  {courses.map(fmtCode).join(" / ")}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: lastRow + 1 }, (_, ri) => (
            <tr key={ri}>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1 text-center text-gray-500 font-medium">{ri + 1}</td>
              {Array.from({ length: room.cols }, (_, ci) => {
                const seat = room.cells[`${ri},${ci}`];
                return seat ? (
                  <td key={ci} title={seat.student_name} className={`border border-gray-200 px-2 py-1 text-center ${cMap.get(seat.course_code)?.c ?? ""}`}>
                    {seat.reg_no}
                  </td>
                ) : (
                  <td key={ci} className="border border-gray-200 px-2 py-1 text-center text-gray-300">–</td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="border border-gray-300 bg-gray-50 px-2 py-1" />
            {Array.from({ length: room.cols - 2 }, (_, i) => <td key={i} className="border border-gray-200 bg-gray-50" />)}
            <td colSpan={2} className="border border-gray-300 bg-gray-100 px-2 py-1 text-right font-medium text-gray-700">
              Total: {room.total_count}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── ReplaceRoomModal ──────────────────────────────────────────────────────────

function ReplaceRoomModal({ open, roomNumber, onClose, onConfirm }: {
  open: boolean; roomNumber: string;
  onClose: () => void; onConfirm: (r: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { if (open) { setValue(""); setStatus("idle"); setErrorMsg(""); } }, [open]);

  const handleConfirm = async () => {
    if (!value.trim()) return;
    setStatus("loading");
    try { await onConfirm(value.trim()); onClose(); }
    catch (e) { setStatus("error"); setErrorMsg(e instanceof Error ? e.message : "Replace failed."); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Replace room</DialogTitle>
          <DialogDescription className="text-gray-500">
            Current room: <strong>{roomNumber}</strong>. Enter a new room number — student positions are preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <input
            autoFocus value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleConfirm(); }}
            placeholder="e.g. AB103"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {status === "error" && (
            <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errorMsg}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!value.trim() || status === "loading"} onClick={() => void handleConfirm()}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            {status === "loading" ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Replacing…</> : "Replace & reload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── ClassMatrixPreview ────────────────────────────────────────────────────────

interface ClassMatrixPreviewProps { sem: string; slot: string; onNavigate?: (page: string) => void }

export function ClassMatrixPreview({ sem, slot, onNavigate }: ClassMatrixPreviewProps) {
  const [data, setData] = useState<PreviewResponse | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "error" | "ready">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [dlStatus, setDlStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [replaceTarget, setReplaceTarget] = useState<RoomPreview | null>(null);

  const fetchPreview = useCallback(async () => {
    setLoadStatus("loading"); setErrorMsg("");
    try {
      if (!API_BASE) throw new Error("VITE_API_URL is not configured.");
      const res = await fetch(`${PREVIEW_ENDPOINT}/${encodeURIComponent(sem)}/${encodeURIComponent(slot)}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})) as { detail?: string }; throw new Error(b.detail ?? `HTTP ${res.status}`); }
      setData(await res.json() as PreviewResponse);
      setLoadStatus("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load preview.");
      setLoadStatus("error");
    }
  }, [sem, slot]);

  useEffect(() => { void fetchPreview(); }, [fetchPreview]);

  const handleReplaceConfirm = async (newRoom: string) => {
    if (!API_BASE) throw new Error("VITE_API_URL is not configured.");
    const res = await fetch(REPLACE_ROOM_ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sem, slot, old_room_id: replaceTarget!.room_id, new_room_number: newRoom }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})) as { detail?: string }; throw new Error(b.detail ?? `HTTP ${res.status}`); }
    setReplaceTarget(null);
    await fetchPreview();
  };

  const handleDownload = async () => {
    setDlStatus("loading");
    try {
      if (!API_BASE) throw new Error("VITE_API_URL is not configured.");
      const res = await fetch(`${DOWNLOAD_ENDPOINT}/${encodeURIComponent(sem)}/${encodeURIComponent(slot)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      Object.assign(document.createElement("a"), { href: url, download: `class_matrix_${sem}_${slot}.zip` }).click();
      URL.revokeObjectURL(url);
      setDlStatus("done");
    } catch { setDlStatus("error"); }
    setTimeout(() => setDlStatus("idle"), 3000);
  };

  if (loadStatus === "loading") return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm">Loading preview for Semester {sem}, Slot {slot}…</p>
    </div>
  );

  if (loadStatus === "error") return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-red-600">{errorMsg}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate?.("seating")}>
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <Button size="sm" onClick={() => void fetchPreview()} className="bg-blue-600 text-white hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-1" />Retry
        </Button>
      </div>
    </div>
  );

  if (!data) return null;

  const dlClass = dlStatus === "done" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : dlStatus === "error" ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div className="space-y-6 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onNavigate?.("seating")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Class matrix preview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.event_name} · {data.date} · Slot {slot}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchPreview()}>
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
          <Button size="sm" disabled={dlStatus === "loading"} onClick={() => void handleDownload()} className={dlClass}>
            {dlStatus === "loading" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
              : dlStatus === "done" ? <><CheckCircle2 className="w-4 h-4 mr-2" />Downloaded</>
              : <><Download className="w-4 h-4 mr-2" />Generate &amp; Download PDF</>}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="px-3 py-1">{data.rooms.length} rooms</Badge>
        <Badge variant="outline" className="px-3 py-1">{data.rooms.reduce((s, r) => s + r.total_count, 0)} students</Badge>
        <Badge variant="outline" className="px-3 py-1">Sem {sem} · Slot {slot}</Badge>
      </div>

      {/* Room cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {data.rooms.map((room) => (
          <div key={room.room_id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-gray-800">{room.room_number}</p>
                <p className="text-xs text-gray-500 mt-0.5">{room.event_name}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex gap-1 flex-wrap">
                  {room.courses.map((c, i) => (
                    <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CC[i % CC.length].b}`}>
                      {fmtCode(c)}
                    </span>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => setReplaceTarget(room)}>
                  Replace room
                </Button>
              </div>
            </div>
            <div className="p-3"><RoomGrid room={room} /></div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">{room.rows} rows × {room.cols} cols</span>
              <span className="text-xs font-medium text-gray-700">{room.total_count} seated</span>
            </div>
          </div>
        ))}
      </div>

      <ReplaceRoomModal
        open={replaceTarget !== null}
        roomNumber={replaceTarget?.room_number ?? ""}
        onClose={() => setReplaceTarget(null)}
        onConfirm={handleReplaceConfirm}
      />
    </div>
  );
}