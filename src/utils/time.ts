/**
 * Time Utilities
 *
 * Utility functions for formatting and displaying time values
 * Uses date-fns for consistent date/time handling
 */

import { formatDistanceToNow, format } from 'date-fns';

/**
 * Get elapsed time from a timestamp
 * Example: "2 hours" or "30 minutes"
 */
export function getElapsedTime(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: false });
}

/**
 * Get relative time from a timestamp with "ago" suffix
 * Example: "2 hours ago" or "30 minutes ago"
 */
export function getRelativeTime(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Format a timestamp as a full date and time
 * Example: "Dec 24, 2025 10:30 AM"
 */
export function formatDateTime(timestamp: string): string {
  return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
}

/**
 * Format a timestamp as time only
 * Example: "10:30 AM"
 */
export function formatTime(timestamp: string): string {
  return format(new Date(timestamp), 'h:mm a');
}

/**
 * Format a timestamp as date only
 * Example: "Dec 24, 2025"
 */
export function formatDate(timestamp: string): string {
  return format(new Date(timestamp), 'MMM d, yyyy');
}
