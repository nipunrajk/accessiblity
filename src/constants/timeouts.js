/**
 * Frontend Timeout Constants
 * Centralized timeout values for API calls and operations
 */

export const TIMEOUTS = {
  // API Timeouts
  AI_ANALYSIS: 30000, // 30 seconds
  AI_FIXES: 20000, // 20 seconds
  LIGHTHOUSE_ANALYSIS: 90000, // 90 seconds
  DOM_SCAN: 15000, // 15 seconds

  // UI Timeouts
  DEBOUNCE_INPUT: 300, // 300ms
  TOAST_DURATION: 5000, // 5 seconds
  LOADING_DELAY: 200, // 200ms before showing loader

  // Retry Configuration
  RETRY_DELAY: 1000, // 1 second
  MAX_RETRIES: 3,
};

export default TIMEOUTS;
