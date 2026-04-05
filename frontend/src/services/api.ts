/**
 * api.ts
 *
 * Centralized API communication layer for the seating allocation system.
 * This module handles all HTTP requests and responses, providing:
 * - Abstraction: Components don't know about HTTP details
 * - Consistency: All API calls follow the same patterns
 * - Testability: API layer can be mocked for component tests
 * - Maintainability: API changes only need updates here
 *
 * Future considerations:
 * - Add retry logic with exponential backoff
 * - Add request/response logging for debugging
 * - Add timeout handling
 * - Support for request cancellation tokens
 * - Error analytics and tracking
 */

import type {
  ExamApiResponse,
  AllocationStatusItem,
  AllocationPayload,
  AllocationResponse,
} from "../types/types";
import { getAuthHeader, formatErrorMessage } from "../utils/helpers";
import {
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/constants";

/**
 * Fetches all available exams and their seating slots
 *
 * This is the primary data fetch for the seating allocation page.
 * Returns exams grouped with their available slots.
 *
 * Error handling:
 * - 401 Unauthorized: Throws error to indicate session expired
 * - Network error: Rethrows with descriptive message
 * - Other HTTP errors: Throws generic error
 *
 * @param signal - AbortSignal to allow canceling the request
 * @returns Promise resolving to exam data with slots
 * @throws Error with specific message for different failure types
 *
 * Example successful response:
 * {
 *   success: true,
 *   data: [
 *     {
 *       exam_id: 101,
 *       event_name: "Mid Term Exam",
 *       semester: "SEM 1",
 *       date: "2026-04-15",
 *       session: "FN",
 *       available_slots: ["A", "B", "C"]
 *     }
 *   ],
 *   count: 1
 * }
 */
export const fetchExams = async (
  signal: AbortSignal,
): Promise<ExamApiResponse> => {
  try {
    const res = await fetch(API_ENDPOINTS.EXAMS, {
      signal,
      headers: getAuthHeader(),
    });

    if (res.status === HTTP_STATUS.UNAUTHORIZED) {
      throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
      throw new Error(ERROR_MESSAGES.EXAM_FETCH_FAILED);
    }

    const data: ExamApiResponse = await res.json();
    return data;
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      throw err;
    }
    throw new Error(formatErrorMessage(err, ERROR_MESSAGES.NETWORK_ERROR));
  }
};

/**
 * Fetches the current allocation status for all slots
 *
 * Determines which slots have already been allocated.
 * This information is used to display "Completed" status on the UI.
 *
 * Error handling:
 * - 401 Unauthorized: Throws error to indicate session expired
 * - Network error: Returns empty array (graceful degradation)
 * - Other errors: Returns empty array (slots will show as pending)
 *
 * @param signal - AbortSignal to allow canceling the request
 * @returns Promise resolving to array of allocated slots
 * @throws Error only for authorization failures
 *
 * Example successful response:
 * [
 *   {
 *     event_name: "Mid Term Exam",
 *     slot: "A",
 *     semester: "SEM 1"
 *   },
 *   {
 *     event_name: "Mid Term Exam",
 *     slot: "B",
 *     semester: "SEM 1"
 *   }
 * ]
 */
export const fetchAllocatedSlots = async (
  signal: AbortSignal,
): Promise<AllocationStatusItem[]> => {
  try {
    const res = await fetch(API_ENDPOINTS.ALLOCATION_STATUS, {
      signal,
      headers: getAuthHeader(),
    });

    if (res.status === HTTP_STATUS.UNAUTHORIZED) {
      throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
      throw new Error(ERROR_MESSAGES.ALLOCATION_STATUS_FETCH_FAILED);
    }

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      throw err;
    }
    throw new Error(
      formatErrorMessage(err, ERROR_MESSAGES.ALLOCATION_STATUS_FETCH_FAILED),
    );
  }
};

/**
 * Submits an allocation request to the backend
 *
 * Initiates the seating allocation process for an exam slot.
 * This is called when a user clicks "Allocate" in the dialog.
 *
 * The payload includes:
 * - exam_id: Which exam to allocate
 * - slot: Which slot (A, B, C, etc.)
 * - sem: Which semester
 * - rows/cols: The seating matrix dimensions
 *
 * Possible outcomes:
 * - 200 OK: Allocation successful, slot will be marked as completed
 * - 409 Conflict: Another user allocated this slot first (race condition)
 * - 4xx/5xx: Various errors which are handled gracefully
 *
 * @param payload - Allocation request data including exam, slot, semester, matrix size
 * @returns Promise resolving to allocation response with success status and message
 *
 * Example successful response:
 * {
 *   ok: true,
 *   message: "Allocation successful"
 * }
 *
 * Example conflict response:
 * {
 *   ok: false,
 *   message: "Already allocated by another user"
 * }
 */
export const postAllocate = async (
  payload: AllocationPayload,
): Promise<AllocationResponse> => {
  try {
    const res = await fetch(API_ENDPOINTS.ALLOCATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // Handle conflict: another user allocated this slot
    if (res.status === HTTP_STATUS.CONFLICT) {
      return {
        ok: false,
        message: data.message ?? ERROR_MESSAGES.ALREADY_ALLOCATED,
      };
    }

    // Handle other HTTP errors
    if (!res.ok) {
      return {
        ok: false,
        message: data.message ?? ERROR_MESSAGES.ALLOCATION_FAILED,
      };
    }

    // Success case
    return {
      ok: true,
      message: SUCCESS_MESSAGES.ALLOCATION_SUCCESSFUL,
    };
  } catch (err) {
    return {
      ok: false,
      message: formatErrorMessage(err, ERROR_MESSAGES.ALLOCATION_FAILED),
    };
  }
};

/**
 * Helper function to validate API response structure
 *
 * Ensures API response has expected properties before processing.
 * Useful for preventing runtime errors from malformed responses.
 *
 * @param response - Response object to validate
 * @returns True if response structure is valid
 */
export const isValidExamResponse = (
  response: unknown,
): response is ExamApiResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    "data" in response &&
    "count" in response &&
    Array.isArray((response as ExamApiResponse).data)
  );
};
