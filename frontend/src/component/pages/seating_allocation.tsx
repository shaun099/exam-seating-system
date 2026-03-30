"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import {
  Building2,
  CheckCircle2,
  Clock,
  Upload,
  Play,
  FileText,
} from "lucide-react";

interface Slot {
  id: string;
  name: string;
  status: "pending" | "completed";
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

const SLOT_ORDER = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const getSlotSortValue = (slot: string) => {
  const idx = SLOT_ORDER.indexOf(slot);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

const EXAMS_ENDPOINT = "http://127.0.0.1:8000/api/v1/exams/";
const ALLOCATE_ENDPOINT = "http://127.0.0.1:8000/api/v1/allocate/";
const SEATING_DEFAULTS_STORAGE_KEY = "seating-default-matrix";

interface AllocateRequestPayload {
  slot: string;
  rows: number;
  cols: number;
}

interface AllocateApiResponse {
  success?: boolean;
}

interface SeatingDefaultMatrix {
  rows: number;
  cols: number;
}

const toSemesterData = (apiData: ExamApiItem[]): Semester[] => {
  const semesterMap = new Map<string, Set<string>>();

  for (const item of apiData) {
    const semesterName = item.semester.trim().toUpperCase();
    if (!semesterName) continue;

    if (!semesterMap.has(semesterName)) {
      semesterMap.set(semesterName, new Set<string>());
    }

    const slotSet = semesterMap.get(semesterName)!;
    for (const slot of item.available_slots ?? []) {
      const normalizedSlot = slot.trim().toUpperCase();
      if (normalizedSlot) {
        slotSet.add(normalizedSlot);
      }
    }
  }

  return Array.from(semesterMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([semesterName, slotSet]) => {
      const semesterId = semesterName.toLowerCase();
      const sortedSlots = Array.from(slotSet).sort((a, b) => {
        const slotDiff = getSlotSortValue(a) - getSlotSortValue(b);
        return slotDiff !== 0 ? slotDiff : a.localeCompare(b);
      });

      return {
        id: semesterId,
        name: semesterName,
        slots: sortedSlots.map((slot) => ({
          id: `${semesterId}-${slot.toLowerCase()}`,
          name: `Slot ${slot}`,
          status: "pending" as const,
        })),
      };
    });
};

const mergeSlotStatuses = (
  freshData: Semester[],
  currentData: Semester[],
): Semester[] => {
  const statusMap = new Map<string, Slot["status"]>();

  for (const semester of currentData) {
    for (const slot of semester.slots) {
      statusMap.set(slot.id, slot.status);
    }
  }

  return freshData.map((semester) => ({
    ...semester,
    slots: semester.slots.map((slot) => ({
      ...slot,
      status: statusMap.get(slot.id) ?? slot.status,
    })),
  }));
};

const getSlotValue = (slotName: string) =>
  slotName
    .replace(/^slot\s+/i, "")
    .trim()
    .toUpperCase();

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

type ModalState = "none" | "room-config";
type AllocationStatus = "idle" | "loading" | "success" | "error";

interface SeatingAllocationProps {
  onNavigate?: (page: string) => void;
  examResponse?: ExamApiResponse | null;
}

export function SeatingAllocation({
  onNavigate,
  examResponse,
}: SeatingAllocationProps) {
  const [activeModal, setActiveModal] = useState<ModalState>("none");
  const [roomOption, setRoomOption] = useState("default");
  const [allocationStatus, setAllocationStatus] =
    useState<AllocationStatus>("idle");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [semesterData, setSemesterData] = useState<Semester[]>(() => {
    if (examResponse?.success && examResponse.data?.length) {
      return toSemesterData(examResponse.data);
    }

    return [];
  });

  useEffect(() => {
    if (examResponse?.success && examResponse.data?.length) {
      setSemesterData(toSemesterData(examResponse.data));
    }
  }, [examResponse]);

  useEffect(() => {
    if (examResponse) return;

    const controller = new AbortController();

    const fetchExamData = async () => {
      try {
        const response = await fetch(EXAMS_ENDPOINT, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch exams: ${response.status}`);
        }

        const payload = (await response.json()) as ExamApiResponse;
        if (payload.success && payload.data?.length) {
          const transformedData = toSemesterData(payload.data);
          setSemesterData((prev) => mergeSlotStatuses(transformedData, prev));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load exam slot data", error);
      }
    };

    void fetchExamData();

    return () => controller.abort();
  }, [examResponse]);

  // Persist semester data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("semesterData", JSON.stringify(semesterData));
  }, [semesterData]);

  const closeRoomConfigModal = () => {
    setActiveModal("none");
    setSelectedSlot(null);
    setAllocationStatus("idle");
  };

  const sendAllocateRequest = async (
    payload: AllocateRequestPayload,
  ): Promise<boolean> => {
    try {
      console.log("Allocate request payload:", payload);

      const response = await fetch(ALLOCATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return false;

      const responseData =
        ((await response.json()) as AllocateApiResponse) ?? null;
      if (typeof responseData?.success === "boolean") {
        return responseData.success;
      }

      return true;
    } catch (error) {
      console.error("Failed to send allocation request", error);
      return false;
    }
  };

  const handleSlotClick = (slot: Slot) => {
    if (slot.status === "completed") return;

    setSelectedSlot(slot);
    setAllocationStatus("idle");
    setActiveModal("room-config");
  };

  const handleAllocateFromModal = async () => {
    if (!selectedSlot) return;

    const matrix = getAllocationMatrix();
    const payload: AllocateRequestPayload = {
      slot: getSlotValue(selectedSlot.name),
      rows: matrix.rows,
      cols: matrix.cols,
    };

    setAllocationStatus("loading");
    const isSuccessful = await sendAllocateRequest(payload);

    if (isSuccessful) {
      setAllocationStatus("success");
      setSemesterData((prev) =>
        prev.map((semester) => ({
          ...semester,
          slots: semester.slots.map((slot) =>
            slot.id === selectedSlot.id
              ? { ...slot, status: "completed" as const }
              : slot,
          ),
        })),
      );
      return;
    }

    setAllocationStatus("error");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

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
        <Button variant="outline" onClick={() => onNavigate?.("room-config")}>
          <Building2 className="w-4 h-4 mr-2" />
          Manage Rooms
        </Button>
      </div>

      {/* Semester Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {semesterData.map((semester) => (
          <Card key={semester.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">
                Semester {semester.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-96 overflow-y-auto pr-2">
              {semester.slots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
                    slot.status === "completed"
                      ? "bg-emerald-50 border-emerald-200 cursor-default"
                      : "bg-card hover:bg-muted cursor-pointer"
                  }`}
                >
                  <span className="font-medium text-foreground">
                    {slot.name}
                  </span>
                  {getStatusBadge(slot.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Configuration Modal */}
      <Dialog
        open={activeModal === "room-config"}
        onOpenChange={(open) => {
          if (!open) closeRoomConfigModal();
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Room Configuration</DialogTitle>
            <DialogDescription className="text-gray-500">
              {selectedSlot
                ? `Do you want to allocate ${selectedSlot.name}?`
                : "Do you want to use the Default Seating Plan?"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {allocationStatus === "idle" && (
              <RadioGroup value={roomOption} onValueChange={setRoomOption}>
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem
                    value="default"
                    id="default"
                    className="border-blue-500 text-blue-600 data-[state=checked]:bg-blue-600"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="default"
                      className="cursor-pointer font-medium text-black"
                    >
                      Use Default List
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      30 Rooms Available - Pre-configured seating plan
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem
                    value="custom"
                    id="custom"
                    className="border-blue-500 text-blue-600 data-[state=checked]:bg-blue-600"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="custom"
                      className="cursor-pointer font-medium text-black"
                    >
                      Create New Plan
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload a custom room configuration CSV
                    </p>
                    {roomOption === "custom" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 bg-transparent"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Room CSV
                      </Button>
                    )}
                  </div>
                </div>
              </RadioGroup>
            )}

            {allocationStatus === "success" && (
              <p className="text-sm text-emerald-600">Allocation successful.</p>
            )}
            {allocationStatus === "error" && (
              <p className="text-sm text-red-600">Allocation failed.</p>
            )}
          </div>
          <div className="flex justify-end">
            {(allocationStatus === "idle" ||
              allocationStatus === "loading") && (
              <Button
                onClick={handleAllocateFromModal}
                disabled={allocationStatus === "loading" || !selectedSlot}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                {allocationStatus === "loading" ? "Allocating..." : "Allocate"}
              </Button>
            )}
            {allocationStatus === "success" && (
              <Button
                onClick={() => {
                  closeRoomConfigModal();
                  onNavigate?.("reports");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            )}
            {allocationStatus === "error" && (
              <Button
                onClick={closeRoomConfigModal}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Retry
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
