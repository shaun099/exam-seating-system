/**
 * constants.ts
 *
 * Centralized configuration and constants for the seating allocation system.
 * This file makes it easy to update API endpoints, modify slot ordering,
 * and adjust configuration without touching component logic.
 *
 * Future: Can be extended to support environment-specific configs,
 * feature flags, or runtime configuration from a config service.
 */

/**
 * API Endpoints
 *
 * These are the backend service endpoints used for seating allocation operations.
 * The base URL is derived from the VITE_API_URL environment variable.
 */
export const API_ENDPOINTS = {
  /** Get all available exams and their slots */
  EXAMS: `${import.meta.env.VITE_API_URL}/api/v1/exams/`,

  /** Submit allocation request for a specific exam slot */
  ALLOCATE: `${import.meta.env.VITE_API_URL}/api/v1/allocate/`,

  /** Get current allocation status for all previously allocated slots */
  ALLOCATION_STATUS: `${import.meta.env.VITE_API_URL}/api/v1/seat-allocations/slots-summary/`,
} as const;

/**
 * Slot Configuration
 *
 * Defines the order and labeling of available slots.
 * This array is used for:
 * - Sorting slots alphabetically
 * - Validating slot letters
 * - Future: Supporting different slot naming schemes
 */
export const SLOT_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * HTTP Status Codes We Explicitly Handle
 *
 * These are specific error codes that need special handling.
 * 409 Conflict: Slot already allocated by another user (race condition)
 * 401 Unauthorized: Session expired or invalid token
 */
export const HTTP_STATUS = {
  /** Someone else allocated this slot while we were processing */
  CONFLICT: 409,
  /** Authentication token is missing or expired */
  UNAUTHORIZED: 401,
} as const;

/**
 * Local Storage Keys
 *
 * Keys used for storing data in browser's local storage.
 * This enables persistence across browser sessions.
 */
export const STORAGE_KEYS = {
  /** Authentication token key */
  AUTH_TOKEN: "auth_token",
} as const;

/**
 * Authorization Headers Configuration
 *
 * Constant header name for API authentication.
 * Used across all API requests.
 */
export const AUTH_HEADER_KEY = "Authorization";

/**
 * Error Messages
 *
 * User-facing error messages for different failure scenarios.
 * Makes it easy to update messaging and support i18n in the future.
 */
export const ERROR_MESSAGES = {
  /** Shown when API returns 401 Unauthorized */
  SESSION_EXPIRED: "Session expired. Please log in again.",

  /** Shown when network request fails */
  NETWORK_ERROR: "Failed to load data. Please check your connection.",

  /** Shown when exam data fetch fails for other reasons */
  EXAM_FETCH_FAILED: "Failed to fetch exams",

  /** Shown when allocation status fetch fails */
  ALLOCATION_STATUS_FETCH_FAILED: "Failed to fetch allocation status",

  /** Generic allocation failure */
  ALLOCATION_FAILED: "Allocation failed",

  /** Shown when another user allocated the slot */
  ALREADY_ALLOCATED: "Already allocated by another user",
} as const;

/**
 * Success Messages
 *
 * User-facing messages for successful operations.
 */
export const SUCCESS_MESSAGES = {
  /** Shown after successful seat allocation */
  ALLOCATION_SUCCESSFUL: "Allocation successful",
} as const;

/**
 * UI Configuration
 *
 * Configuration values for UI behaviors and display.
 * Enables easy customization without component changes.
 */
export const UI_CONFIG = {
  /** Maximum height for semester slot containers (with overflow scrolling) */
  MAX_SEMESTER_HEIGHT: "max-h-96",

  /** Default grid columns for semester cards (responsive: 1 on mobile, 3 on desktop) */
  SEMESTER_GRID: "grid-cols-1 md:grid-cols-3",
} as const;
