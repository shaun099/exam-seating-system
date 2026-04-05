import { useEffect, useRef, useState } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import {
  Search,
  Loader2,
  MapPin,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Hash,
  GraduationCap,
  Armchair,
} from "lucide-react";

interface LookupResult {
  reg_no: string;
  name: string;
  room_number: string;
  seat_number: string;
  row_label: string;
  col_label: string;
  course_code: string;
  course_name: string;
  event_name: string;
  sem: string;
  slot: string;
  session: string;
  start_time: string;
  end_time: string;
  date: string;
}

type LookupStatus =
  | "idle"
  | "loading"
  | "found"
  | "no_window"
  | "not_found"
  | "no_seat"
  | "error";

const API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return Number.isFinite(h)
    ? `${(h % 12) || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
    : t;
};

const prettyDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const STATUS_UI: Record<
  Exclude<LookupStatus, "idle" | "loading" | "found">,
  { icon: ReactNode; title: string; desc: string; accent: string; bg: string }
> = {
  no_window: {
    icon: <Clock className="h-6 w-6" />,
    title: "No active exam window",
    desc: "The exam lookup is not currently active. Please try again during your scheduled exam time.",
    accent: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
  },
  not_found: {
    icon: <AlertCircle className="h-6 w-6" />,
    title: "Register number not found",
    desc: "We couldn't find a student with that register number. Please double-check and try again.",
    accent: "text-red-500",
    bg: "bg-red-50 border-red-200",
  },
  no_seat: {
    icon: <AlertCircle className="h-6 w-6" />,
    title: "No seat allocation found",
    desc: "No seat has been allocated for you in today's active exam. Please contact the examination cell.",
    accent: "text-red-500",
    bg: "bg-red-50 border-red-200",
  },
  error: {
    icon: <AlertCircle className="h-6 w-6" />,
    title: "Something went wrong",
    desc: "Unable to reach the server. Please check your connection and try again.",
    accent: "text-red-500",
    bg: "bg-red-50 border-red-200",
  },
};

function InfoRow({
  icon,
  label,
  value,
  highlight,
  wrap,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  wrap?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        highlight
          ? "bg-cyan-50 border border-cyan-100"
          : "bg-slate-50 border border-slate-100"
      }`}
    >
      <span className={highlight ? "text-cyan-600" : "text-slate-400"}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p
          className={`text-sm font-bold ${wrap ? "whitespace-normal break-words leading-snug" : "truncate"} ${
            highlight ? "text-cyan-900" : "text-slate-800"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function StudentSeatingPage() {
  const [regNo, setRegNo] = useState("");
  const [status, setStatus] = useState<LookupStatus>("idle");
  const [result, setResult] = useState<LookupResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (status === "found" || status === "no_window" || status === "not_found" || status === "no_seat" || status === "error") {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [status]);

  const handleLookup = async () => {
    const trimmed = regNo.trim().toUpperCase();
    if (!trimmed || !API_BASE) {
      if (!API_BASE) setStatus("error");
      return;
    }

    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/site-activation/student-lookup/${encodeURIComponent(trimmed)}`
      );

      if (res.ok) {
        setResult((await res.json()) as LookupResult);
        setStatus("found");
        return;
      }

      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      const detail = body.detail ?? "error";

      if (detail === "no_active_window") setStatus("no_window");
      else if (detail === "student_not_found") setStatus("not_found");
      else if (detail === "no_seat_found") setStatus("no_seat");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  const handleReset = () => {
    setRegNo("");
    setStatus("idle");
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleLookup();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto scroll-smooth bg-slate-900">
      {/* Background */}
      <img
        src="/sjcet.jpg"
        alt="SJCET campus"
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div className="fixed inset-0 bg-slate-900/70" />

      {/* Scrollable content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-start px-3 py-8 sm:px-4 sm:py-10">
        <div className="w-full max-w-2xl space-y-5">

          {/* Header */}
          <div className="text-center space-y-2 text-white pt-4">
            <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Seat Finder</h1>
            <p className="text-sm text-slate-300 max-w-xs mx-auto">
              Enter your register number to instantly find your seat, room, and exam details.
            </p>
          </div>

          {/* Search card */}
          {status !== "found" && (
            <div className="w-full space-y-4 rounded-2xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 sm:p-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Register Number
                </label>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Type your register number exactly as provided by the college.
                </p>
                <input
                  ref={inputRef}
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                  onKeyDown={handleKey}
                  placeholder="e.g. SJCET22CS001"
                  disabled={status === "loading"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base font-mono tracking-[0.12em] text-black placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-50 transition-all sm:text-lg sm:tracking-[0.18em]"
                />
              </div>

              <button
                onClick={() => void handleLookup()}
                disabled={!regNo.trim() || status === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Find My Seat
                  </>
                )}
              </button>
            </div>
          )}

          {/* Result card */}
          {status === "found" && result && (
            <div
              ref={resultRef}
              className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300"
            >
              {/* Header band */}
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-cyan-100" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-cyan-100">
                    Seat Confirmed
                  </span>
                </div>
                <p className="text-xl font-bold">{result.name}</p>
                <p className="break-all text-sm font-mono text-cyan-100">{result.reg_no}</p>
                <p className="mt-1 break-words text-xs text-cyan-200">{result.event_name}</p>
              </div>

              {/* Seat hero */}
              <div className="grid grid-cols-1 divide-y divide-slate-100 border-b border-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="flex flex-col items-center justify-center gap-1 py-4">
                  <MapPin className="h-5 w-5 text-cyan-500 mb-0.5" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Room</p>
                  <p className="break-all px-2 text-3xl font-black text-slate-900 sm:text-4xl">{result.room_number}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 py-4">
                  <Armchair className="h-5 w-5 text-cyan-500 mb-0.5" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Seat</p>
                  <p className="break-all px-2 text-3xl font-black text-slate-900 sm:text-4xl">{result.seat_number}</p>
                  <p className="text-xs text-slate-400">
                    Row&nbsp;<span className="font-semibold text-slate-600">{result.row_label}</span>
                    &nbsp;·&nbsp;Col&nbsp;
                    <span className="font-semibold text-slate-600">{result.col_label}</span>
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="space-y-2 p-4">
                <InfoRow
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Course"
                  value={`${result.course_code} — ${result.course_name}`}
                  wrap
                />
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Semester & Slot"
                  value={`Semester ${result.sem}  ·  Slot ${result.slot}`}
                  highlight
                />
                <InfoRow
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Session"
                  value={result.session}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date"
                  value={prettyDate(result.date)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Time"
                  value={`${fmtTime(result.start_time)} – ${fmtTime(result.end_time)}`}
                />
              </div>

              {/* Reset button */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleReset}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" />
                  Search another register number
                </button>
              </div>
            </div>
          )}

          {/* Error / status cards */}
          {(status === "no_window" ||
            status === "not_found" ||
            status === "no_seat" ||
            status === "error") && (
            <div
              ref={resultRef}
              className="w-full space-y-4 rounded-2xl border bg-white p-6 text-center shadow-xl transition-all duration-300"
            >
              <div
                className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ${STATUS_UI[status].accent}`}
              >
                {STATUS_UI[status].icon}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base">
                  {STATUS_UI[status].title}
                </p>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {STATUS_UI[status].desc}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}

          <p className="pb-6 text-center text-sm font-medium text-slate-300">
            SJCET · Examination Cell
          </p>
        </div>
      </div>
    </div>
  );
}