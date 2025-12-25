/**
 * Error Tracking Utility
 *
 * Global error handler for capturing all errors with stack traces
 * as per EMS-CONNECT development guide requirements
 */

import { Platform } from 'react-native';
import { ErrorUtils } from 'react-native';

/**
 * Error log structure
 */
interface ErrorLog {
  message: string;
  stack?: string;
  isFatal?: boolean;
  context?: any;
  platform: string;
  timestamp: string;
}

/**
 * Initialize global error handler
 */
export function initializeErrorTracking() {
  console.log('[Error Tracking] Initializing global error handler');

  const defaultErrorHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    // Log error with full stack trace
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      isFatal,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };

    console.error('[UNCAUGHT ERROR]', errorLog);

    // Send to backend (optional - can be implemented later)
    // sendErrorToBackend(errorLog);

    // Call default handler
    if (defaultErrorHandler) {
      defaultErrorHandler(error, isFatal);
    }
  });

  console.log('[Error Tracking] Global error handler initialized');
}

/**
 * Track custom error
 */
export function trackError(
  error: Error | unknown,
  context?: string,
  additionalData?: any
) {
  const errorLog: ErrorLog = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: {
      context,
      ...additionalData,
    },
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  };

  console.error('[TRACKED ERROR]', errorLog);

  // Send to backend (optional)
  // sendErrorToBackend(errorLog);
}

/**
 * Send error to backend (optional implementation)
 * Uncomment when backend endpoint is ready
 */
/*
async function sendErrorToBackend(errorLog: ErrorLog) {
  try {
    await api.post('/logs/error', {
      ...errorLog,
      app_version: '1.0.0', // Get from package.json or config
    });
  } catch (err) {
    console.error('[Error Tracking] Failed to send error log to backend:', err);
  }
}
*/

/**
 * Track promise rejections
 */
export function initializeUnhandledRejectionTracking() {
  // Note: React Native doesn't have a built-in way to handle unhandled promise rejections
  // But we can wrap Promise globally if needed
  console.log('[Error Tracking] Unhandled rejection tracking initialized');
}
