/**
 * helpers.ts
 *
 * Pure utility functions for the seating allocation system.
 * These are standalone functions with no side effects, making them:
 * - Easy to test with unit tests
 * - Reusable across components
 * - Predictable and maintainable
 *
 * All functions are pure functions that don't depend on external state.
 */

import {
  SLOT_ORDER,
  STORAGE_KEYS,
  AUTH_HEADER_KEY,
} from "../constants/constants";

/**
 * Retrieves the authentication header for API requests
 *
 * Reads the auth token from localStorage and formats it as a Bearer token.
 * This header is required for all authenticated API calls.
 *
 * Returns an empty object if running on server-side (no localStorage)
 * or if no token is found (user not authenticated).
 *
 * @returns Object with Authorization header, or empty object if unavailable
 *
 * Example:
 * {
 *   Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
export const getAuthHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return token ? { [AUTH_HEADER_KEY]: `Bearer ${token}` } : {};
};

/**
 * Normalizes a slot string to uppercase and removes whitespace
 *
 * Ensures consistent slot representation throughout the system.
 * For example, "slot a", " A ", "a" all become "A".
 * This prevents bugs caused by inconsistent slot naming.
 *
 * @param slot - Raw slot string from API or user input
 * @returns Normalized uppercase slot letter
 *
 * Example:
 * normalizeSlot("  slot-a  ") → "A"
 * normalizeSlot("b") → "B"
 */
export const normalizeSlot = (slot: string): string =>
  slot.trim().toUpperCase();

/**
 * Gets the sort order value for a slot letter
 *
 * Used for sorting slots alphabetically (A, B, C, ...).
 * Returns the index position in the SLOT_ORDER array.
 * If a slot letter is not recognized, returns MAX_SAFE_INTEGER
 * to sort unknown slots to the end.
 *
 * This enables flexible slot ordering without hard-coding positions.
 * Future: Could be extended to support custom slot orderings.
 *
 * @param slot - Normalized slot letter (e.g., "A", "B")
 * @returns Sort order value (lower values sort first)
 *
 * Example:
 * getSlotSortValue("A") → 0
 * getSlotSortValue("C") → 2
 * getSlotSortValue("Z") → 25
 * getSlotSortValue("?") → 9007199254740991 (MAX_SAFE_INTEGER)
 */
export const getSlotSortValue = (slot: string): number => {
  const idx = SLOT_ORDER.indexOf(slot);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

/**
 * Validates if a slot string is valid and recognized
 *
 * A valid slot must:
 * - Be a single character after normalization
 * - Be a letter that exists in SLOT_ORDER
 *
 * @param slot - Slot string to validate
 * @returns True if valid, false otherwise
 *
 * Example:
 * isValidSlot("A") → true
 * isValidSlot("a") → true
 * isValidSlot(" B ") → true
 * isValidSlot("ABC") → false
 * isValidSlot("1") → false
 */
export const isValidSlot = (slot: string): boolean => {
  const normalized = normalizeSlot(slot);
  return normalized.length === 1 && SLOT_ORDER.includes(normalized);
};

/**
 * Checks if user is authenticated by looking for auth token
 *
 * Useful for conditionally rendering UI elements or making
 * decisions about whether to attempt API calls.
 *
 * @returns True if auth token exists in localStorage
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem("token") ||
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  );
};

/**
 * Creates a formatted error message based on error type
 *
 * Converts various error formats into user-friendly messages.
 * Handles Error objects, strings, and unknown types.
 *
 * @param error - The error object to format
 * @param fallbackMessage - Message to use if error type is unknown
 * @returns Formatted error message
 *
 * Example:
 * formatErrorMessage(new Error("Network failed")) → "Network failed"
 * formatErrorMessage("UNAUTHORIZED") → "UNAUTHORIZED"
 * formatErrorMessage({}) → "Unknown error occurred"
 */
export const formatErrorMessage = (
  error: unknown,
  fallbackMessage: string = "Unknown error occurred",
): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallbackMessage;
};

/**
 * Validates semester string and normalizes it for consistency
 *
 * Ensures semester identifiers are consistently formatted.
 * Empty or whitespace-only semesters are considered invalid.
 *
 * @param semester - Raw semester string from API
 * @returns Normalized uppercase semester string, or null if invalid
 *
 * Example:
 * normalizeSemester("sem 1") → "SEM 1"
 * normalizeSemester("  ") → null
 * normalizeSemester("") → null
 */
export const normalizeSemester = (semester: string): string | null => {
  const normalized = semester?.trim().toUpperCase();
  return normalized && normalized.length > 0 ? normalized : null;
};
