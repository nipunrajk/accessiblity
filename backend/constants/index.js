/**
 * Backend Constants
 * Centralized configuration values and magic numbers
 */

// API Configuration
export const API = {
  DEFAULT_PORT: 3001,
  DEFAULT_FRONTEND_URL: 'http://localhost:5176',
  REQUEST_SIZE_LIMIT: '10mb',
};

// AI Configuration
export const AI = {
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  MAX_ISSUES_TO_PROCESS: 5,
  MAX_RECOMMENDATIONS_PER_ISSUE: 3,
  ANALYSIS_TIMEOUT: 30000, // 30 seconds
  FIXES_TIMEOUT: 20000, // 20 seconds
};

// Analysis Configuration
export const ANALYSIS = {
  MAX_PAGES_TO_SCAN: 10,
  SCAN_TIMEOUT: 60000, // 60 seconds
  LIGHTHOUSE_TIMEOUT: 90000, // 90 seconds
};

// Issue Types
export const ISSUE_TYPES = {
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  BEST_PRACTICES: 'best-practices',
  SEO: 'seo',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  ANALYSIS_ERROR: 'ANALYSIS_ERROR',
};

// Response Messages
export const MESSAGES = {
  ANALYSIS_SUCCESS: 'Analysis completed successfully',
  ANALYSIS_FAILED: 'Failed to analyze website',
  AI_UNAVAILABLE: 'AI provider not configured',
  INVALID_URL: 'Invalid URL format',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
};

// Puppeteer Configuration
export const PUPPETEER = {
  HEADLESS: 'new',
  ARGS: ['--no-sandbox', '--disable-setuid-sandbox'],
  WAIT_UNTIL: 'networkidle0',
};

// GitHub Configuration
export const GITHUB = {
  API_BASE_URL: 'https://api.github.com',
  MIN_TOKEN_LENGTH: 10,
};

export default {
  API,
  AI,
  ANALYSIS,
  ISSUE_TYPES,
  HTTP_STATUS,
  ERROR_CODES,
  MESSAGES,
  PUPPETEER,
  GITHUB,
};
