"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Upload, Play, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";


type AllocationStatus = "idle" | "loading" | "success" | "error";

interface Slot {
  id: string;
  name: string;
  status: "pending" | "completed";
  examId: number;
}

interface RoomConfigurationModalProps {
  open: boolean;
  selectedSlot: Slot | null;
  roomOption: string;
  allocationStatus: AllocationStatus;
  allocationError: string | null; // surfaced backend message
  onRoomOptionChange: (value: string) => void;
  onClose: () => void;
  onAllocate: () => void;
  onGeneratePdf: () => void;
  onRetry: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatusMessage = ({
  status,
  error,
}: {
  status: AllocationStatus;
  error: string | null;
}) => {
  if (status === "success") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-700">
          Allocation completed successfully.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          {error ?? "Allocation failed. Please try again."}
        </p>
      </div>
    );
  }

  return null;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RoomConfigurationModal({
  open,
  selectedSlot,
  roomOption,
  allocationStatus,
  allocationError,
  onRoomOptionChange,
  onClose,
  onAllocate,
  onGeneratePdf,
  onRetry,
}: RoomConfigurationModalProps) {
  const isLoading = allocationStatus === "loading";
  const isDone = allocationStatus === "success" || allocationStatus === "error";

  // Prevent closing mid-allocation
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isLoading) return;
    if (!nextOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Room Configuration</DialogTitle>
          <DialogDescription className="text-gray-500">
            {selectedSlot
              ? `Allocate seating for ${selectedSlot.name}`
              : "Select a seating plan to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Room option selector — hidden once allocation is done */}
          {!isDone && (
            <RadioGroup
              value={roomOption}
              onValueChange={onRoomOptionChange}
              aria-label="Room configuration options"
            >
              {/* Default plan */}
              <label
                htmlFor="default"
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  roomOption === "default"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
              >
                <RadioGroupItem
                  value="default"
                  id="default"
                  disabled={isLoading}
                  className="mt-0.5 border-blue-500 text-blue-600 data-[state=checked]:bg-blue-600"
                />
                <div className="flex-1">
                  <span className="font-medium text-black text-sm">
                    Use Default Plan
                  </span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Pre-configured seating — 30 rooms available
                  </p>
                </div>
              </label>

              {/* Custom plan */}
              <label
                htmlFor="custom"
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  roomOption === "custom"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
              >
                <RadioGroupItem
                  value="custom"
                  id="custom"
                  disabled={isLoading}
                  className="mt-0.5 border-blue-500 text-blue-600 data-[state=checked]:bg-blue-600"
                />
                <div className="flex-1">
                  <span className="font-medium text-black text-sm">
                    Upload Custom Plan
                  </span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Upload a room configuration CSV
                  </p>
                  {roomOption === "custom" && !isLoading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 bg-transparent"
                      type="button"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Room CSV
                    </Button>
                  )}
                </div>
              </label>
            </RadioGroup>
          )}

          {/* Status message — success or error with backend message */}
          <StatusMessage status={allocationStatus} error={allocationError} />
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-2">
          {/* Cancel — always visible except mid-load */}
          {!isLoading && allocationStatus !== "success" && (
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
          )}

          {/* Allocate */}
          {(allocationStatus === "idle" || isLoading) && (
            <Button
              onClick={onAllocate}
              disabled={isLoading || !selectedSlot}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[110px]"
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Allocating…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Allocate
                </>
              )}
            </Button>
          )}

          {/* Success actions */}
          {allocationStatus === "success" && (
            <Button
              onClick={onGeneratePdf}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              type="button"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate PDF
            </Button>
          )}

          {/* Error — retry closes modal so user can re-open with fresh state */}
          {allocationStatus === "error" && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              type="button"
            >
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}