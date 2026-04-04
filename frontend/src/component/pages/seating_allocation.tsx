"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Building2,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { RoomConfigurationModal } from "./RoomConfigurationModal.tsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXAMS_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/v1/exams/`;
const ALLOCATE_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/v1/allocate/`;
const ALLOCATION_STATUS_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/v1/seat-allocations/slots-summary/`;
const SEATING_DEFAULTS_STORAGE_KEY = "seating-default-matrix";

const SLOT_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SlotStatus = "pending" | "completed";
type AllocationStatus = "idle" | "loading" | "success" | "error";
type FetchState = "idle" | "loading" | "error";

interface Slot {
  id: string;
  name: string; // "Slot A"
  status: SlotStatus;
  examId: number; // representative exam_id
  eventName: string;
  semester: string; // New: Added semester
  slotLetter: string; // New: "A"
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

interface AllocationStatusItem {
  event_name: string;
  slot: string;
  semester: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getAuthHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeSlot = (slot: string): string => slot.trim().toUpperCase();

const getSlotSortValue = (slot: string): number => {
  const idx = SLOT_ORDER.indexOf(slot);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

// ---------------------------------------------------------------------------
// Data Processing - Group by Semester + Unique Slot Letter
// ---------------------------------------------------------------------------

const toSemesterData = (apiData: ExamApiItem[]): Semester[] => {
  const semesterMap = new Map<string, Map<string, Slot>>(); // semester -> slotLetter -> Slot

  for (const item of apiData) {
    const semesterName = item.semester?.trim().toUpperCase();
    if (!semesterName) continue;

    if (!semesterMap.has(semesterName)) {
      semesterMap.set(semesterName, new Map());
    }

    const slotMap = semesterMap.get(semesterName)!;

    for (const rawSlot of item.available_slots ?? []) {
      const slotLetter = normalizeSlot(rawSlot);
      if (!slotLetter) continue;

      // Keep only one entry per slot letter per semester (use first exam as representative)
      if (!slotMap.has(slotLetter)) {
        slotMap.set(slotLetter, {
          id: `${semesterName.toLowerCase()}-slot-${slotLetter.toLowerCase()}`,
          name: `Slot ${slotLetter}`,
          status: "pending" as const,
          examId: item.exam_id,
          eventName: item.event_name,
          semester: semesterName,
          slotLetter: slotLetter,
        });
      }
    }
  }

  return Array.from(semesterMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([semesterName, slotMap]) => {
      const slots = Array.from(slotMap.values());
      slots.sort(
        (a, b) =>
          getSlotSortValue(a.slotLetter) - getSlotSortValue(b.slotLetter),
      );

      return {
        id: semesterName.toLowerCase(),
        name: semesterName,
        slots,
      };
    });
};

// ---------------------------------------------------------------------------
// Merge Allocation Status
// ---------------------------------------------------------------------------

const mergeAllocationStatuses = (
  semesters: Semester[],
  allocatedItems: AllocationStatusItem[],
): Semester[] => {
  const allocatedSet = new Set(
    allocatedItems.map(
      (item) =>
        `${item.semester.trim().toUpperCase()}__${normalizeSlot(item.slot)}`,
    ),
  );

  return semesters.map((sem) => ({
    ...sem,
    slots: sem.slots.map((slot) => ({
      ...slot,
      status: allocatedSet.has(
        `${slot.semester.trim().toUpperCase()}__${slot.slotLetter}`,
      )
        ? "completed"
        : "pending",
    })),
  }));
};

const getDefaultMatrix = () => {
  const fallback = { rows: 6, cols: 5 };
  try {
    const raw = localStorage.getItem(SEATING_DEFAULTS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { rows?: number; cols?: number };
    return {
      rows:
        Number.isFinite(parsed.rows) && (parsed.rows ?? 0) > 0
          ? parsed.rows!
          : fallback.rows,
      cols:
        Number.isFinite(parsed.cols) && (parsed.cols ?? 0) > 0
          ? parsed.cols!
          : fallback.cols,
    };
  } catch {
    return fallback;
  }
};

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

const fetchExams = async (signal: AbortSignal): Promise<ExamApiResponse> => {
  const res = await fetch(EXAMS_ENDPOINT, { signal, headers: getAuthHeader() });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Failed to fetch exams");
  return res.json();
};

const fetchAllocatedSlots = async (
  signal: AbortSignal,
): Promise<AllocationStatusItem[]> => {
  const res = await fetch(ALLOCATION_STATUS_ENDPOINT, {
    signal,
    headers: getAuthHeader(),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Failed to fetch allocation status");
  const data = await res.json();
  return data.data || [];
};

// Updated postAllocate to accept sem
const postAllocate = async (payload: {
  exam_id: number;
  slot: string;
  sem: string; // New field
  rows: number;
  cols: number;
}) => {
  const res = await fetch(ALLOCATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (res.status === 409) {
    return {
      ok: false,
      message: data.message ?? "Already allocated by another user",
    };
  }
  if (!res.ok) {
    return { ok: false, message: data.message ?? "Allocation failed" };
  }

  return { ok: true, message: "Allocation successful" };
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface SeatingAllocationProps {
  onNavigate?: (page: string) => void;
  examResponse?: ExamApiResponse | null;
}

export function SeatingAllocation({
  onNavigate,
  examResponse,
}: SeatingAllocationProps) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [allocationStatus, setAllocationStatus] =
    useState<AllocationStatus>("idle");
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const isAllocating = useRef(false);

  // Load data on mount
  useEffect(() => {
    const controller = new AbortController();

    const performLoad = async () => {
      setFetchState("loading");
      setFetchError(null);

      try {
        let examsData: ExamApiResponse;
        if (examResponse?.success && examResponse.data?.length > 0) {
          examsData = examResponse;
        } else {
          examsData = await fetchExams(controller.signal);
        }

        const allocatedItems = await fetchAllocatedSlots(controller.signal);

        const freshSemesters = toSemesterData(examsData.data);
        const finalSemesters = mergeAllocationStatuses(
          freshSemesters,
          allocatedItems,
        );

        setSemesters(finalSemesters);
        setFetchState("idle");
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const errorMsg =
          err instanceof Error && err.message === "UNAUTHORIZED"
            ? "Session expired. Please log in again."
            : "Failed to load data. Please check your connection.";
        setFetchError(errorMsg);
        setFetchState("error");
      }
    };

    void performLoad();
    return () => controller.abort();
  }, [examResponse]);

  const handleRetry = useCallback(async () => {
    const controller = new AbortController();
    setFetchState("loading");
    setFetchError(null);

    try {
      let examsData: ExamApiResponse;
      if (examResponse?.success && examResponse.data?.length > 0) {
        examsData = examResponse;
      } else {
        examsData = await fetchExams(controller.signal);
      }

      const allocatedItems = await fetchAllocatedSlots(controller.signal);

      const freshSemesters = toSemesterData(examsData.data);
      const finalSemesters = mergeAllocationStatuses(
        freshSemesters,
        allocatedItems,
      );

      setSemesters(finalSemesters);
      setFetchState("idle");
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const errorMsg =
        err instanceof Error && err.message === "UNAUTHORIZED"
          ? "Session expired. Please log in again."
          : "Failed to load data. Please check your connection.";
      setFetchError(errorMsg);
      setFetchState("error");
    }
  }, [examResponse]);

  const handleSlotClick = (slot: Slot) => {
    if (slot.status === "completed") return;
    setSelectedSlot(slot);
    setAllocationStatus("idle");
    setAllocationError(null);
  };

  const markSlotAsCompleted = (slotId: string) => {
    setSemesters((prev) =>
      prev.map((sem) => ({
        ...sem,
        slots: sem.slots.map((s) =>
          s.id === slotId ? { ...s, status: "completed" as const } : s,
        ),
      })),
    );
  };

  const handleAllocate = async () => {
    if (!selectedSlot || isAllocating.current) return;

    isAllocating.current = true;
    setAllocationStatus("loading");
    setAllocationError(null);

    const matrix = getDefaultMatrix();
    const payload = {
      exam_id: selectedSlot.examId,
      slot: selectedSlot.slotLetter,
      sem: selectedSlot.semester, // ← New: Sending semester
      rows: matrix.rows,
      cols: matrix.cols,
    };

    const result = await postAllocate(payload);
    isAllocating.current = false;

    if (result.ok) {
      setAllocationStatus("success");
      markSlotAsCompleted(selectedSlot.id);
    } else {
      setAllocationStatus("error");
      setAllocationError(result.message);
    }
  };

  const closeModal = () => {
    setSelectedSlot(null);
    setAllocationStatus("idle");
    setAllocationError(null);
    isAllocating.current = false;
  };

  const SlotStatusBadge = ({ status }: { status: SlotStatus }) =>
    status === "completed" ? (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-sm">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </div>
    ) : (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-sm">
        <Clock className="w-3 h-3" />
        Pending
      </div>
    );

  if (fetchState === "loading") {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading exam slots...
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-destructive">
        <AlertCircle className="w-6 h-6" />
        <p>{fetchError}</p>
        <Button variant="outline" onClick={handleRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Seating Allocation
          </h1>
          <p className="text-muted-foreground">
            Manage seating allocation for exam slots
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onNavigate?.("room-config")}>
            <Building2 className="w-4 h-4 mr-2" />
            Manage Rooms
          </Button>
        </div>
      </div>

      {semesters.length === 0 && (
        <div className="py-24 text-center text-muted-foreground">
          No exam data available. Upload an appearance list to get started.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {semesters.map((semester) => (
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
                  onClick={() => handleSlotClick(slot)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    handleSlotClick(slot)
                  }
                  className={`p-4 rounded-lg border flex items-center justify-between transition-all ${
                    slot.status === "completed"
                      ? "bg-emerald-50 border-emerald-200 cursor-default"
                      : "bg-card hover:bg-muted cursor-pointer"
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

      <RoomConfigurationModal
        open={!!selectedSlot}
        selectedSlot={selectedSlot}
        allocationStatus={allocationStatus}
        allocationError={allocationError}
        roomOption="default"
        onClose={closeModal}
        onAllocate={handleAllocate}
        onRoomOptionChange={() => {}}
        onGeneratePdf={() => {
          closeModal();
          onNavigate?.("reports");
        }}
        onRetry={closeModal}
      />
    </div>
  );
}
