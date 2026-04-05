"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CalendarDays, Clock3, Loader2, Power, RefreshCw, Trash2, Pencil, X, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlotSummaryItem { event_name: string; slot: string; sem?: string; semester?: string; date: string; session?: string }
interface ActivationRecord { id: number; sem: string; slot: string; session?: string; date: string; start_time: string; end_time: string; time_gap: string; event_name?: string; status: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const SUMMARY_EP   = `${API_BASE}/api/v1/site-activation/slots-summary`;
const LEGACY_SUMMARY_EP = `${API_BASE}/api/v1/seat-allocations/slots-summary`;
const ACTIVATION_EP = `${API_BASE}/api/v1/site-activation`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const toDate = (v: string) => { const d = new Date(v); return isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const prettyDate = (v: string) => { const d = new Date(`${v}T00:00:00`); return isNaN(d.getTime()) ? v : d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric", year:"numeric" }); };
const fmtTime = (t: string) => { const [h,m] = t.split(":").map(Number); return isFinite(h) ? `${(h%12)||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}` : t; };
const durationLabel = (m: number) => m < 60 ? `${m} min` : `${m/60} hr`;
const prettySession = (value?: string) => {
  const v = (value || "").trim();
  if (!v) return "Not specified";
  const u = v.toUpperCase();
  if (u === "FN" || u === "FORENOON") return "Forenoon";
  if (u === "AN" || u === "AF" || u === "AFTERNOON") return "Afternoon";
  return v;
};
const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return 0;
  const startM = sh * 60 + sm;
  let endM = eh * 60 + em;
  if (endM <= startM) endM += 24 * 60;
  return endM - startM;
};
const isActive = (r: ActivationRecord) => { const now = new Date(); const today = toDate(now.toISOString()); if (today !== r.date) return false; const n = now.getHours()*60+now.getMinutes(); const [sh,sm] = r.start_time.split(":").map(Number); const [eh,em] = r.end_time.split(":").map(Number); return n >= sh*60+sm && n <= eh*60+em; };
const getAuth = (): Record<string,string> => { const t = typeof window !== "undefined" && (localStorage.getItem("auth_token")||localStorage.getItem("token")); return t ? { Authorization:`Bearer ${t}` } : {}; };

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success"|"error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm border
      ${type==="success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
      {type==="success" ? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <AlertCircle className="w-4 h-4 shrink-0"/>}
      <span className="flex-1">{message}</span>
      <button onClick={onClose}><X className="w-4 h-4"/></button>
    </div>
  );
}

// ── ActivationModal (for both add from slot card and edit) ────────────────────

interface ModalProps {
  sem: string; slot: string; date: string; eventName: string; session?: string;
  editRecord?: ActivationRecord | null;
  onSaved: () => void; onClose: () => void;
  showToast: (m: string, t: "success"|"error") => void;
}

function ActivationModal({ sem, slot, date, eventName, session, editRecord, onSaved, onClose, showToast }: ModalProps) {
  const [selectedDate, setSelectedDate] = useState(editRecord?.date ?? date);
  const [startTime, setStartTime] = useState(editRecord?.start_time?.slice(0,5) ?? "09:00");
  const [endAt, setEndAt] = useState(editRecord?.end_time?.slice(0,5) ?? "10:00");
  const [saving, setSaving] = useState(false);
  const normalizedSession = prettySession(session ?? editRecord?.session);
  const timeGap = durationLabel(minutesBetween(startTime, endAt));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${ACTIVATION_EP}/`, {
        method: "POST",
        headers: { "Content-Type":"application/json", ...getAuth() },
        body: JSON.stringify({ sem, slot, session: session ?? editRecord?.session, date: selectedDate, start_time: startTime, end_time: endAt, time_gap: timeGap, event_name: eventName, status:"scheduled" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`${editRecord?"Updated":"Activated"} ${sem} · Slot ${slot}`, "success");
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save.", "error");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">{editRecord ? "Edit" : "Activate"} — {sem} · Slot {slot}</DialogTitle>
          <DialogDescription className="text-gray-500">{eventName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
            <div><span className="font-medium text-slate-500">Semester:</span> <span className="font-semibold text-slate-800">{sem}</span></div>
            <div><span className="font-medium text-slate-500">Slot:</span> <span className="font-semibold text-slate-800">{slot}</span></div>
            <div><span className="font-medium text-slate-500">Date:</span> <span className="font-semibold text-slate-800">{prettyDate(selectedDate)}</span></div>
            <div><span className="font-medium text-slate-500">Session:</span> <span className="font-semibold text-slate-800">{normalizedSession}</span></div>
            <div className="sm:col-span-2"><span className="font-medium text-slate-500">Time:</span> <span className="font-semibold text-slate-800">{fmtTime(startTime)} - {fmtTime(endAt)}</span></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/>Date</Label>
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock3 className="h-3 w-3"/>Start Time</Label>
              <Input type="time" step={900} value={startTime} onChange={e => setStartTime(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock3 className="h-3 w-3"/>End Time</Label>
              <Input type="time" step={900} value={endAt} onChange={e => setEndAt(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">{timeGap}</div>
            </div>
          </div>
          <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">Time Window</span>
            <span className="font-medium text-slate-800">{fmtTime(startTime)} - {fmtTime(endAt)}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">SEM: {sem}</Badge>
            <Badge variant="secondary">SLOT: {slot}</Badge>
            <Badge variant="secondary">SESSION: {normalizedSession}</Badge>
            <Badge variant="secondary">DATE: {prettyDate(selectedDate)}</Badge>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={() => void handleSave()} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <><Loader2 className="w-3 h-3 mr-1 animate-spin"/>Saving…</> : <><Power className="w-3 h-3 mr-1"/>{editRecord ? "Update" : "Activate"}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SiteActivation() {
  const [summaryItems, setSummaryItems]     = useState<SlotSummaryItem[]>([]);
  const [records, setRecords]               = useState<ActivationRecord[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [toast, setToast]                   = useState<{msg:string;type:"success"|"error"}|null>(null);
  const [modal, setModal]                   = useState<{ sem:string; slot:string; session?:string; date:string; eventName:string; editRecord?:ActivationRecord }|null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<ActivationRecord|null>(null);
  const [deleting, setDeleting]             = useState(false);

  const showToast = useCallback((msg:string, type:"success"|"error") => setToast({msg,type}), []);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      let res = await fetch(SUMMARY_EP, { headers: getAuth() });
      if (!res.ok) {
        // Backward compatibility while backend routes are being aligned.
        res = await fetch(LEGACY_SUMMARY_EP, { headers: getAuth() });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { data: SlotSummaryItem[] };
      setSummaryItems(json.data ?? []);
    } catch { setSummaryItems([]); }
    finally { setSummaryLoading(false); }
  };

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const res = await fetch(`${ACTIVATION_EP}/`, { headers: getAuth() });
      if (!res.ok) throw new Error();
      setRecords(await res.json() as ActivationRecord[]);
    } catch { setRecords([]); }
    finally { setRecordsLoading(false); }
  }, []);

  useEffect(() => { void loadSummary(); void loadRecords(); }, []); // eslint-disable-line

  // Slots not yet activated (match on sem+slot)
  const activatedKeys = useMemo(() => new Set(records.map(r => `${r.sem}|${r.slot}`)), [records]);
  const pendingSlots  = useMemo(() => summaryItems.filter(s => {
    const sem = (s.sem ?? s.semester ?? "").trim().toUpperCase();
    const slot = s.slot.trim().toUpperCase();
    return sem && !activatedKeys.has(`${sem}|${slot}`);
  }), [summaryItems, activatedKeys]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${ACTIVATION_EP}/${encodeURIComponent(deleteTarget.sem)}/${encodeURIComponent(deleteTarget.slot)}`, { method:"DELETE", headers:getAuth() });
      if (!res.ok) throw new Error();
      showToast(`Deleted ${deleteTarget.sem} · Slot ${deleteTarget.slot}`, "success");
      setDeleteTarget(null);
      await loadRecords();
    } catch { showToast("Delete failed.", "error"); }
    finally { setDeleting(false); }
  };

  const handleSaved = async () => { setModal(null); await loadRecords(); };

  const activeCount = records.filter(isActive).length;

  return (
    <div className="mx-auto w-full max-w-5xl p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Activation Window</h1>
          <p className="text-sm text-slate-500">Activate exam slots and manage active windows.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && <Badge className="bg-emerald-600 text-white gap-1"><Zap className="w-3 h-3"/>{activeCount} Active</Badge>}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { void loadSummary(); void loadRecords(); }}>
            <RefreshCw className={`h-4 w-4 ${summaryLoading||recordsLoading?"animate-spin":""}`}/>Refresh
          </Button>
        </div>
      </div>

      {/* Pending Slots */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600"/>
            Slots to Activate
            {pendingSlots.length > 0 && <Badge variant="secondary">{pendingSlots.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4"><Loader2 className="w-4 h-4 animate-spin"/>Loading slots…</div>
          ) : pendingSlots.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-lg">
              {summaryItems.length === 0 ? "No slot summary data available." : "All slots have been activated."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingSlots.map(s => {
                const sem      = (s.sem ?? s.semester ?? "").trim().toUpperCase();
                const slotCode = s.slot.trim().toUpperCase();
                const date     = toDate(s.date) || s.date;
                const session  = prettySession(s.session);
                return (
                  <div key={`${sem}-${slotCode}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{sem}</span>
                        <span className="text-slate-400 text-xs">·</span>
                        <span className="text-slate-700 text-sm">Slot {slotCode}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{prettyDate(date)} · {session}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{s.event_name}</p>
                    </div>
                    <Button size="sm" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs gap-1"
                      onClick={() => setModal({ sem, slot: slotCode, date, session: s.session, eventName: s.event_name })}>
                      <Power className="w-3 h-3"/>Activate
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activated Sites */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600"/>Activated Sites
            {records.length > 0 && <Badge variant="secondary">{records.length}</Badge>}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => void loadRecords()}>
            <RefreshCw className={`h-3.5 w-3.5 ${recordsLoading?"animate-spin":""}`}/>
          </Button>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4"><Loader2 className="w-4 h-4 animate-spin"/>Loading…</div>
          ) : records.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-lg">No activation windows saved yet.</div>
          ) : (
            <div className="space-y-3">
              {[...records].sort((a,b) => (isActive(a)?0:1)-(isActive(b)?0:1) || new Date(b.date).getTime()-new Date(a.date).getTime()).map(r => (
                <div key={r.id} className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${isActive(r)?"border-emerald-200 bg-emerald-50":"border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isActive(r)?"bg-emerald-500 animate-pulse":"bg-slate-300"}`}/>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{r.sem}</span>
                        <span className="text-slate-400 text-xs">·</span>
                        <span className="text-slate-700 text-sm">Slot {r.slot}</span>
                        {r.session && <Badge variant="secondary">Session {prettySession(r.session)}</Badge>}
                        <Badge className={isActive(r)?"bg-emerald-600 text-white":"bg-slate-200 text-slate-700"}>
                          {isActive(r) ? <><Zap className="w-3 h-3 mr-1"/>Active Now</> : "Scheduled"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>{prettyDate(r.date)}</span>
                        <span>{fmtTime(r.start_time)} – {fmtTime(r.end_time)}</span>
                        <span className="text-slate-400">{r.time_gap}</span>
                        {r.event_name && <span className="truncate max-w-[200px]">{r.event_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                      onClick={() => setModal({ sem:r.sem, slot:r.slot, date:r.date, eventName:r.event_name??"", session:r.session, editRecord:r })}>
                      <Pencil className="w-3.5 h-3.5"/>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-red-600" onClick={() => setDeleteTarget(r)}>
                      <Trash2 className="w-3.5 h-3.5"/>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activate / Edit Modal */}
      {modal && (
        <ActivationModal {...modal} onSaved={handleSaved} onClose={() => setModal(null)} showToast={showToast}/>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Delete activation window?</DialogTitle>
            <DialogDescription className="text-gray-500">
              Permanently remove <strong>{deleteTarget?.sem}</strong> · Slot <strong>{deleteTarget?.slot}</strong> on <strong>{deleteTarget ? prettyDate(deleteTarget.date) : ""}</strong>. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" disabled={deleting} onClick={() => void handleDelete()} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin"/>Deleting…</> : <><Trash2 className="w-3 h-3 mr-1"/>Delete</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}