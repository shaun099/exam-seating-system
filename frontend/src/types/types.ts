/**
 * types.ts
 *
 * Central location for all TypeScript interfaces and types used in the seating allocation system.
 * This file ensures type consistency across all modules and makes it easy to extend the system
 * with new features like role-based access, audit logging, or scheduling constraints.
 */

/**
 * Represents the status of a seating slot
 * - pending: Waiting to be allocated
 * - completed: Successfully allocated
 */
export type SlotStatus = "pending" | "completed";

/**
 * Represents the overall state of an allocation operation
 * - idle: No operation in progress
 * - loading: Operation is in progress
 * - success: Operation completed successfully
 * - error: Operation failed
 */
export type AllocationStatus = "idle" | "loading" | "success" | "error";

/**
 * Represents the state of data fetching from APIs
 * - idle: No fetch in progress
 * - loading: Fetch in progress
 * - error: Fetch failed
 */
export type FetchState = "idle" | "loading" | "error";

/**
 * Represents a single seating slot within a semester
 *
 * Example:
 * {
 *   id: "sem-1-slot-a",
 *   name: "Slot A",
 *   status: "pending",
 *   examId: 101,
 *   eventName: "Mid Term Exam",
 *   semester: "SEM 1",
 *   slotLetter: "A"
 * }
 */
export interface Slot {
  /** Unique identifier for the slot */
  id: string;
  /** Display name (e.g., "Slot A") */
  name: string;
  /** Current allocation status */
  status: SlotStatus;
  /** Associated exam ID for the allocation request */
  examId: number;
  /** Name of the event/exam */
  eventName: string;
  /** Semester identifier */
  semester: string;
  /** Letter representing the slot (A, B, C, etc.) */
  slotLetter: string;
}

/**
 * Represents a collection of slots grouped by semester
 *
 * Example:
 * {
 *   id: "sem-1",
 *   name: "SEM 1",
 *   slots: [Slot A, Slot B, ...]
 * }
 */
export interface Semester {
  /** Unique identifier for the semester */
  id: string;
  /** Display name (e.g., "SEM 1") */
  name: string;
  /** Array of slots within this semester */
  slots: Slot[];
}

/**
 * Represents exam data as received from the API
 *
 * Example:
 * {
 *   exam_id: 101,
 *   event_name: "Mid Term Exam",
 *   semester: "SEM 1",
 *   date: "2026-04-15",
 *   session: "FN",
 *   available_slots: ["A", "B"]
 * }
 */
export interface ExamApiItem {
  /** Unique exam identifier from the backend */
  exam_id: number;
  /** Name of the exam/event */
  event_name: string;
  /** Semester the exam belongs to */
  semester: string;
  /** Date of the exam */
  date: string;
  /** Session time (FN = Forenoon, AN = Afternoon, etc.) */
  session: string;
  /** List of available slots for this exam */
  available_slots: string[];
}

/**
 * Represents the response structure from the exams API endpoint
 */
export interface ExamApiResponse {
  /** Success flag from the API */
  success: boolean;
  /** Array of exam data */
  data: ExamApiItem[];
  /** Total count of exams */
  count: number;
}

/**
 * Represents a single item in the allocation status response
 * Used to track which slots have already been allocated
 */
export interface AllocationStatusItem {
  /** Name of the event/exam */
  event_name: string;
  /** Slot letter */
  slot: string;
  /** Semester identifier */
  semester: string;
}

/**
 * Payload structure for the allocation API request
 * Sent to backend when allocating seating for a slot
 */
export interface AllocationPayload {
  /** The exam ID to allocate */
  exam_id: number;
  /** The slot letter to allocate (A, B, C, etc.) */
  slot: string;
  /** The semester identifier */
  sem: string;
  /** Number of rows in the seating matrix */
  rows: number;
  /** Number of columns in the seating matrix */
  cols: number;
}

/**
 * Response structure for an allocation API call
 */
export interface AllocationResponse {
  /** Whether the allocation was successful */
  ok: boolean;
  /** Message from the API (error or success message) */
  message: string;
}

/**
 * Props for the SeatingAllocation component
 */
export interface SeatingAllocationProps {
  /** Callback to navigate to different pages */
  onNavigate?: (page: string) => void;
  /** Optional pre-fetched exam data to use instead of making API call */
  examResponse?: ExamApiResponse | null;
}
