/**
 * dataProcessing.ts
 * Pure data transformation functions for the seating allocation system.
 */

import type {
  Slot,
  Semester,
  ExamApiItem,
  AllocationStatusItem,
} from "../types/types";
import { normalizeSlot, getSlotSortValue, normalizeSemester } from "./helpers";

/**
 * Transforms raw exam API data into hierarchical semester/slot structure.
 * Deduplicates slots across exams, keeping the first exam as representative.
 * Sorts semesters numerically and slots alphabetically.
 *
 * @param apiData - Raw exam data from API
 * @returns Array of semesters with deduplicated slots
 */
export const toSemesterData = (apiData: ExamApiItem[]): Semester[] => {
  const semesterMap = new Map<string, Map<string, Slot>>();

  for (const item of apiData) {
    const semesterName = normalizeSemester(item.semester);
    if (!semesterName) continue;

    if (!semesterMap.has(semesterName)) {
      semesterMap.set(semesterName, new Map());
    }

    const slotMap = semesterMap.get(semesterName)!;

    for (const rawSlot of item.available_slots ?? []) {
      const slotLetter = normalizeSlot(rawSlot);
      if (!slotLetter) continue;

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

/**
 * Updates slot statuses based on allocation data.
 * Marks slots as "completed" if they are in the allocated items list.
 *
 * @param semesters - Semester array with slots (all pending initially)
 * @param allocatedItems - List of already allocated slots
 * @returns New semester array with updated slot statuses
 */
export const mergeAllocationStatuses = (
  semesters: Semester[],
  allocatedItems: AllocationStatusItem[],
): Semester[] => {
  const allocatedSet = new Set(
    allocatedItems.map(
      (item) =>
        `${normalizeSemester(item.semester) || item.semester}__${normalizeSlot(item.slot)}`,
    ),
  );

  return semesters.map((sem) => ({
    ...sem,
    slots: sem.slots.map((slot) => ({
      ...slot,
      status: allocatedSet.has(`${slot.semester}__${slot.slotLetter}`)
        ? ("completed" as const)
        : ("pending" as const),
    })),
  }));
};

/**
 * Checks if semester data has at least one semester with slots.
 *
 * @param semesters - Semester array to check
 * @returns True if data exists
 */
export const hasSemesterData = (semesters: Semester[]): boolean => {
  return semesters.length > 0 && semesters.some((sem) => sem.slots.length > 0);
};

/**
 * Calculates allocation statistics (total, completed, pending slots).
 *
 * @param semesters - Current semester data
 * @returns Statistics object with counts and completion percentage
 */
export const getAllocationStats = (semesters: Semester[]) => {
  let totalSlots = 0;
  let completedSlots = 0;
  let pendingSlots = 0;

  for (const sem of semesters) {
    for (const slot of sem.slots) {
      totalSlots++;
      if (slot.status === "completed") {
        completedSlots++;
      } else {
        pendingSlots++;
      }
    }
  }

  return {
    totalSlots,
    completedSlots,
    pendingSlots,
    completionPercentage:
      totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0,
  };
};
