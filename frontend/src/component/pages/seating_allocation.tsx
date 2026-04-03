"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { RoomConfigurationModal } from "./RoomConfigurationModal.tsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXAMS_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/v1/exams/`;
const ALLOCATE_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/v1/allocate/`;
const SEATING_DEFAULTS_STORAGE_KEY = "seating-default-matrix";
const SLOT_STATUS_STORAGE_KEY = "seating-slot-statuses-v2"; // v2 — bumped to invalidate stale shape

const SLOT_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SlotStatus = "pending" | "completed";
type ModalState = "none" | "room-config";
type AllocationStatus = "idle" | "loading" | "success" | "error";
type FetchState = "idle" | "loading" | "error";

interface Slot {
  id: string;
  name: string;
  status: SlotStatus;
  examId: number; // retained from API — required by allocate payload
}

interface Semester {
  id: string;
  name: string;
  slots: Slot[];
}

interface ExamApiItem {
  exam_id: number;
  event_name: string;
  semester: string;
  date: string;
  session: string;
  available_slots: string[];
}

interface ExamApiResponse {
  success: boolean;
  data: ExamApiItem[];
  count: number;
}

interface AllocateRequestPayload {
  exam_id: number; // was missing entirely in original
  slot: string;
  rows: number;
  cols: number;
}

interface AllocateApiResponse {
  success: boolean;
  message?: string; // backend error detail surfaced to user
}

interface SeatingDefaultMatrix {
  rows: number;
  cols: number;
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/**
 * Returns Authorization header from your app's token store.
 *
 * TODO (backend): Replace the localStorage read below with however your
 * app actually exposes the session token — e.g. from a React context,
 * Zustand store, or cookie. If you use HttpOnly cookies, remove this
 * function entirely and let the browser send the cookie automatically.
 */
const getAuthHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const getSlotSortValue = (slot: string): number => {
  const idx = SLOT_ORDER.indexOf(slot);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

const normalizeSlot = (slot: string): string => slot.trim().toUpperCase();

const getSlotValue = (slotName: string): string =>
  slotName
    .replace(/^slot\s+/i, "")
    .trim()
    .toUpperCase();

/**
 * Transforms flat API exam list into grouped semester data.
 * exam_id is now retained on every Slot so it reaches the allocate request.
 *
 * Uses Map<slotLetter, examId> internally so each slot carries its own
 * exam reference even when multiple exams share the same semester label.
 */
const toSemesterData = (apiData: ExamApiItem[]): Semester[] => {
  const semesterMap = new Map<string, Map<string, number>>();

  for (const item of apiData) {
    const semesterName = item.semester?.trim().toUpperCase();
    if (!semesterName) continue;

    if (!semesterMap.has(semesterName)) {
      semesterMap.set(semesterName, new Map());
    }

    const slotMap = semesterMap.get(semesterName)!;
    for (const slot of item.available_slots ?? []) {
      const normalized = normalizeSlot(slot);
      if (normalized) slotMap.set(normalized, item.exam_id);
    }
  }

  return Array.from(semesterMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([semesterName, slotMap]) => {
      const semesterId = semesterName.toLowerCase();
      const sortedSlots = Array.from(slotMap.keys()).sort((a, b) => {
        const diff = getSlotSortValue(a) - getSlotSortValue(b);
        return diff !== 0 ? diff : a.localeCompare(b);
      });

      return {
        id: semesterId,
        name: semesterName,
        slots: sortedSlots.map((slot) => ({
          id: `${semesterId}-${slot.toLowerCase()}`,
          name: `Slot ${slot}`,
          status: "pending" as const,
          examId: slotMap.get(slot)!,
        })),
      };
    });
};

/**
 * Merges persisted slot statuses into freshly fetched semester data.
 * localStorage is only a render-speed cache — backend is the authority.
 */
const mergeSlotStatuses = (
  freshData: Semester[],
  statusMap: Map<string, SlotStatus>,
): Semester[] =>
  freshData.map((semester) => ({
    ...semester,
    slots: semester.slots.map((slot) => ({
      ...slot,
      status: statusMap.get(slot.id) ?? slot.status,
    })),
  }));

const loadPersistedStatuses = (): Map<string, SlotStatus> => {
  try {
    const raw = localStorage.getItem(SLOT_STATUS_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, SlotStatus>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
};

const persistStatuses = (semesters: Semester[]): void => {
  const out: Record<string, SlotStatus> = {};
  for (const sem of semesters)
    for (const slot of sem.slots)
      if (slot.status === "completed") out[slot.id] = "completed";
  try {
    localStorage.setItem(SLOT_STATUS_STORAGE_KEY, JSON.stringify(out));
  } catch {
    // Silently ignore — private browsing or storage quota exceeded.
  }
};

const getAllocationMatrix = (): SeatingDefaultMatrix => {
  const fallback: SeatingDefaultMatrix = { rows: 6, cols: 5 };
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

// ---------------------------------------------------------------------------
// API layer
// ---------------------------------------------------------------------------

const fetchExams = async (signal: AbortSignal): Promise<ExamApiResponse> => {
  const response = await fetch(EXAMS_ENDPOINT, {
    signal,
    headers: { ...getAuthHeader() },
  });
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error(`Exams fetch failed: ${response.status}`);
  return response.json() as Promise<ExamApiResponse>;
};

/**
 * Never throws. Returns { ok, message } so the UI can surface the
 * exact reason for failure, including 409 Conflict from race conditions.
 */
const postAllocate = async (
  payload: AllocateRequestPayload,
): Promise<{ ok: boolean; message: string }> => {
  try {
    const response = await fetch(ALLOCATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as AllocateApiResponse;

    if (response.status === 409) {
      return {
        ok: false,
        message:
          data.message ??
          "Already allocated by another user. Refresh to see the latest state.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        message: data.message ?? `Request failed (${response.status}).`,
      };
    }

    return { ok: data.success !== false, message: data.message ?? "" };
  } catch {
    return {
      ok: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SlotStatusBadge = ({ status }: { status: SlotStatus }) =>
  status === "completed" ? (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Completed
    </Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>
  );

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SeatingAllocationProps {
  onNavigate?: (page: string) => void;
  examResponse?: ExamApiResponse | null;
}

export function SeatingAllocation({
  onNavigate,
  examResponse,
}: SeatingAllocationProps) {
  const [semesterData, setSemesterData] = useState<Semester[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [activeModal, setActiveModal] = useState<ModalState>("none");
  const [roomOption, setRoomOption] = useState("default");
  const [allocationStatus, setAllocationStatus] =
    useState<AllocationStatus>("idle");
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Guards against double-fire on rapid clicks of the allocate button.
  const isAllocating = useRef(false);

  // ------------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------------

  const applyFreshData = useCallback((data: ExamApiItem[]) => {
    const statuses = loadPersistedStatuses();
    setSemesterData(mergeSlotStatuses(toSemesterData(data), statuses));
  }, []);

  // Seed from SSR / parent-prefetched prop
  useEffect(() => {
    if (!examResponse?.success || !examResponse.data?.length) return;
    applyFreshData(examResponse.data);
  }, [examResponse, applyFreshData]);

  // Client-side fetch with retry support
  useEffect(() => {
    if (examResponse) return;

    const controller = new AbortController();

    const load = async () => {
      setFetchState("loading");
      setFetchError(null);
      try {
        const payload = await fetchExams(controller.signal);
        if (payload.success && payload.data?.length) {
          applyFreshData(payload.data);
        }
        setFetchState("idle");
      } catch (err) {
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error && err.message === "UNAUTHORIZED"
            ? "Session expired. Please log in again."
            : "Failed to load exam data. Check your connection.";
        setFetchError(msg);
        setFetchState("error");
      }
    };

    void load();
    return () => controller.abort();
  }, [examResponse, retryCount, applyFreshData]);

  // Persist statuses on every change
  useEffect(() => {
    if (semesterData.length > 0) persistStatuses(semesterData);
  }, [semesterData]);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  const markSlotCompleted = useCallback((slotId: string) => {
    setSemesterData((prev) =>
      prev.map((semester) => ({
        ...semester,
        slots: semester.slots.map((slot) =>
          slot.id === slotId ? { ...slot, status: "completed" as const } : slot,
        ),
      })),
    );
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal("none");
    setSelectedSlot(null);
    setAllocationStatus("idle");
    setAllocationError(null);
    isAllocating.current = false;
  }, []);

  const handleSlotClick = useCallback((slot: Slot) => {
    if (slot.status === "completed") return;
    setSelectedSlot(slot);
    setAllocationStatus("idle");
    setAllocationError(null);
    setActiveModal("room-config");
  }, []);

  const handleAllocate = useCallback(async () => {
    // Ref guard prevents double-submission on rapid clicks
    if (!selectedSlot || isAllocating.current) return;

    isAllocating.current = true;
    setAllocationStatus("loading");
    setAllocationError(null);

    const matrix = getAllocationMatrix();
    const payload: AllocateRequestPayload = {
      exam_id: selectedSlot.examId,
      slot: getSlotValue(selectedSlot.name),
      rows: matrix.rows,
      cols: matrix.cols,
    };

    const { ok, message } = await postAllocate(payload);
    isAllocating.current = false;

    if (ok) {
      setAllocationStatus("success");
      markSlotCompleted(selectedSlot.id);
    } else {
      setAllocationStatus("error");
      setAllocationError(message);
    }
  }, [selectedSlot, markSlotCompleted]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (fetchState === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading exam data…
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-destructive">
        <AlertCircle className="w-6 h-6" />
        <p className="text-sm">{fetchError}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRetryCount((c) => c + 1)}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Seating Allocation
          </h1>
          <p className="text-muted-foreground">
            Manage seating allocation for exam slots
          </p>
        </div>
        <Button variant="outline" onClick={() => onNavigate?.("room-config")}>
          <Building2 className="w-4 h-4 mr-2" />
          Manage Rooms
        </Button>
      </div>

      {/* Empty state */}
      {semesterData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
          <p className="text-sm">
            No exam data available. Upload an appearance list to get started.
          </p>
        </div>
      )}

      {/* Semester cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {semesterData.map((semester) => (
          <Card key={semester.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">
                Semester {semester.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {semester.slots.map((slot) => (
                <div
                  key={slot.id}
                  role="button"
                  tabIndex={slot.status === "completed" ? -1 : 0}
                  aria-disabled={slot.status === "completed"}
                  aria-label={`${slot.name} — ${slot.status}`}
                  onClick={() => handleSlotClick(slot)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleSlotClick(slot);
                  }}
                  className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
                    slot.status === "completed"
                      ? "bg-emerald-50 border-emerald-200 cursor-default"
                      : "bg-card hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  }`}
                >
                  <span className="font-medium text-foreground">
                    {slot.name}
                  </span>
                  <SlotStatusBadge status={slot.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal — allocationError is now passed down so the modal can display it */}
      <RoomConfigurationModal
        open={activeModal === "room-config"}
        selectedSlot={selectedSlot}
        roomOption={roomOption}
        allocationStatus={allocationStatus}
        allocationError={allocationError}
        onRoomOptionChange={setRoomOption}
        onClose={closeModal}
        onAllocate={handleAllocate}
        onGeneratePdf={() => {
          closeModal();
          onNavigate?.("reports");
        }}
        onRetry={closeModal}
      />
    </div>
  );
}
