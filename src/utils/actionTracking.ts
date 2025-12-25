/**
 * User Action Tracking Utility
 *
 * Tracks user actions throughout the app for debugging and analytics
 * as per EMS-CONNECT development guide requirements
 */

/**
 * Track user action with context
 */
export function trackAction(action: string, context?: any) {
  console.log('[USER ACTION]', {
    action,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send to analytics backend (optional - can be implemented later)
  // sendActionToBackend({ action, context });
}

/**
 * Common action types for consistency
 */
export const ActionTypes = {
  // Auth actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // Duty actions
  DUTY_TOGGLE: 'DUTY_TOGGLE',
  DUTY_ON: 'DUTY_ON',
  DUTY_OFF: 'DUTY_OFF',
  DUTY_TOGGLE_FAILED: 'DUTY_TOGGLE_FAILED',

  // Dispatch actions
  DISPATCH_ACCEPT: 'DISPATCH_ACCEPT',
  DISPATCH_DECLINE: 'DISPATCH_DECLINE',
  DISPATCH_EN_ROUTE: 'DISPATCH_EN_ROUTE',
  DISPATCH_ARRIVED: 'DISPATCH_ARRIVED',
  DISPATCH_COMPLETED: 'DISPATCH_COMPLETED',
  DISPATCH_STATUS_UPDATE_FAILED: 'DISPATCH_STATUS_UPDATE_FAILED',

  // Navigation actions
  NAVIGATE_TO_MAP: 'NAVIGATE_TO_MAP',
  NAVIGATE_TO_INCIDENT_DETAILS: 'NAVIGATE_TO_INCIDENT_DETAILS',
  NAVIGATE_TO_PRE_ARRIVAL: 'NAVIGATE_TO_PRE_ARRIVAL',
  NAVIGATE_BACK: 'NAVIGATE_BACK',

  // Form actions
  PRE_ARRIVAL_SUBMIT: 'PRE_ARRIVAL_SUBMIT',
  PRE_ARRIVAL_SUBMIT_FAILED: 'PRE_ARRIVAL_SUBMIT_FAILED',

  // Location actions
  LOCATION_PERMISSION_GRANTED: 'LOCATION_PERMISSION_GRANTED',
  LOCATION_PERMISSION_DENIED: 'LOCATION_PERMISSION_DENIED',
  LOCATION_UPDATE_SENT: 'LOCATION_UPDATE_SENT',
  LOCATION_UPDATE_FAILED: 'LOCATION_UPDATE_FAILED',

  // Notification actions
  NOTIFICATION_PERMISSION_GRANTED: 'NOTIFICATION_PERMISSION_GRANTED',
  NOTIFICATION_PERMISSION_DENIED: 'NOTIFICATION_PERMISSION_DENIED',
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
  NOTIFICATION_TAPPED: 'NOTIFICATION_TAPPED',

  // Map actions
  MAP_ROUTE_FETCHED: 'MAP_ROUTE_FETCHED',
  MAP_ROUTE_FETCH_FAILED: 'MAP_ROUTE_FETCH_FAILED',
  MAP_CENTERED: 'MAP_CENTERED',
  MAP_DISPATCH_SELECTED: 'MAP_DISPATCH_SELECTED',

  // Phone call
  CALL_REPORTER: 'CALL_REPORTER',
  CALL_EMERGENCY: 'CALL_EMERGENCY',
} as const;

/**
 * Send action to analytics backend (optional implementation)
 * Uncomment when backend endpoint is ready
 */
/*
async function sendActionToBackend(actionData: any) {
  try {
    await api.post('/logs/action', actionData);
  } catch (err) {
    console.error('[Action Tracking] Failed to send action log to backend:', err);
  }
}
*/
