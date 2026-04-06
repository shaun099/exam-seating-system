"use client";

/**
 * seating_allocation.tsx
 *
 * Main component for the seating allocation page.
 * This component orchestrates the user interface and data flow.
 *
 * Architecture:
 * - This component handles UI state and lifecycle
 * - Data fetching is delegated to api.ts
 * - Data transformation is delegated to dataProcessing.ts
 * - Helper functions are delegated to helpers.ts
 * - All types are imported from types.ts
 * - All constants are imported from constants.ts
 *
 * This separation ensures:
 * - Components are focused on UI/UX
 * - Business logic is testable and reusable
 * - Changes to API or data format only affect respective modules
 * - Easy to add new features without growing component size
 */

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
import { getDefaultMatrix } from "../../utils/roomConfig.ts";

// Type imports
import type {
  Slot,
  Semester,
  SlotStatus,
  AllocationStatus,
  FetchState,
  ExamApiResponse,
  SeatingAllocationProps,
} from "../../types/types.ts";

// API imports
import {
  fetchExams,
  fetchAllocatedSlots,
  postAllocate,
} from "../../services/api.ts";

// Data processing imports
import {
  toSemesterData,
  mergeAllocationStatuses,
} from "../../utils/dataProcessing.ts";

// Constants imports
import { ERROR_MESSAGES, UI_CONFIG } from "../../constants/constants.ts";

export function SeatingAllocation({
  onNavigate,
  examResponse,
}: SeatingAllocationProps) {
  // State management
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [roomOption, setRoomOption] = useState<string>("default");
  const [allocationStatus, setAllocationStatus] =
    useState<AllocationStatus>("idle");
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const isAllocating = useRef(false);

  /**
   * Loads exam and allocation status data on component mount and when examResponse changes.
   *
   * Flow:
   * 1. Set loading state
   * 2. Try to use provided examResponse or fetch from API
   * 3. Fetch current allocation status
   * 4. Transform API data to semester structure
   * 5. Merge allocation statuses into the structure
   * 6. Update state with final data
   * 7. Handle errors (unauthorized = session expired, others = network error)
   */
  useEffect(() => {
    const controller = new AbortController();

    const performLoad = async () => {
      setFetchState("loading");
      setFetchError(null);

      try {
        // Use provided exam data or fetch from API
        let examsData: ExamApiResponse;
        if (examResponse?.success && examResponse.data?.length > 0) {
          examsData = examResponse;
        } else {
          examsData = await fetchExams(controller.signal);
        }

        // Fetch which slots have already been allocated
        const allocatedItems = await fetchAllocatedSlots(controller.signal);

        // Transform API data into semester/slot structure
        const freshSemesters = toSemesterData(examsData.data);

        // Merge allocation status to mark completed slots
        const finalSemesters = mergeAllocationStatuses(
          freshSemesters,
          allocatedItems,
        );

        setSemesters(finalSemesters);
        setFetchState("idle");
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        // Distinguish between authorization and network errors
        const errorMsg =
          err instanceof Error && err.message === "UNAUTHORIZED"
            ? ERROR_MESSAGES.SESSION_EXPIRED
            : ERROR_MESSAGES.NETWORK_ERROR;

        setFetchError(errorMsg);
        setFetchState("error");
      }
    };

    void performLoad();
    return () => controller.abort();
  }, [examResponse]);

  /**
   * Retries loading data after a fetch error.
   *
   * Uses the same logic as the initial load but with explicit user trigger.
   * Useful for manual recovery from network errors.
   */
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
          ? ERROR_MESSAGES.SESSION_EXPIRED
          : ERROR_MESSAGES.NETWORK_ERROR;

      setFetchError(errorMsg);
      setFetchState("error");
    }
  }, [examResponse]);

  /**
   * Handles slot click to open allocation modal.
   * Only allows clicking on pending slots (completed slots are read-only).
   */
  const handleSlotClick = (slot: Slot) => {
    if (slot.status === "completed") return;
    setSelectedSlot(slot);
    setAllocationStatus("idle");
    setAllocationError(null);
  };

  /**
   * Marks a slot as completed in the UI.
   * Called after successful allocation API response.
   */
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

  /**
   * Handles the allocation submission.
   *
   * Flow:
   * 1. Validate slot is selected and not already allocating
   * 2. Set loading state
   * 3. Get seating matrix configuration
   * 4. Send allocation request to API
   * 5. Handle response (success or error)
   * 6. Update UI based on result
   */
  const handleAllocate = async () => {
    if (!selectedSlot || isAllocating.current) return;

    isAllocating.current = true;
    setAllocationStatus("loading");
    setAllocationError(null);

    const matrix = getDefaultMatrix();
    const payload = {
      exam_id: selectedSlot.examId,
      slot: selectedSlot.slotLetter,
      sem: selectedSlot.semester,
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

  /**
   * Closes the allocation modal and resets related state.
   */
  const closeModal = () => {
    setSelectedSlot(null);
    setRoomOption("default");
    setAllocationStatus("idle");
    setAllocationError(null);
    isAllocating.current = false;
  };

  /**
   * SlotStatusBadge Component
   *
   * Displays the current allocation status of a slot with appropriate color and icon.
   * - Green with checkmark: Completed (already allocated)
   * - Gray with clock: Pending (waiting to be allocated)
   */
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

  // =========================================================================
  // RENDER
  // =========================================================================

  // Loading state: Show spinner while fetching data
  if (fetchState === "loading") {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading exam slots...
      </div>
    );
  }

  // Error state: Show error message with retry button
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

  // Success state: Render semester cards with slots
  return (
    <div className="space-y-6">
      {/* Header with title and action buttons */}
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

      {/* Empty state: No exam data available */}
      {semesters.length === 0 && (
        <div className="py-24 text-center text-muted-foreground">
          No exam data available. Upload an appearance list to get started.
        </div>
      )}

      {/* Semester cards grid */}
      <div className={`grid ${UI_CONFIG.SEMESTER_GRID} gap-6`}>
        {semesters.map((semester) => (
          <Card key={semester.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">
                Semester {semester.name}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`p-4 space-y-3 ${UI_CONFIG.MAX_SEMESTER_HEIGHT} overflow-y-auto`}
            >
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

      {/* Allocation modal */}
      <RoomConfigurationModal
        open={!!selectedSlot}
        selectedSlot={selectedSlot}
        allocationStatus={allocationStatus}
        allocationError={allocationError}
        roomOption={roomOption}
        onClose={closeModal}
        onAllocate={handleAllocate}
        onRoomOptionChange={setRoomOption}
        onGeneratePdf={() => {
          closeModal();
          onNavigate?.("reports");
        }}
        onRetry={closeModal}
        onNavigate={onNavigate}
      />
    </div>
  );
}
