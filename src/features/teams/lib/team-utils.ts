/**
 * Shared utility functions for the Teams feature.
 */

/**
 * Formats a date string or null/undefined value to a human-readable locale string.
 * Returns '-' if the value is nullish or invalid.
 */
export function formatDate(value?: string | null): string {
  if (!value) return '-'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return String(value)
  return dt.toLocaleString()
}
