import { config } from '../config/index.js';

// API Configuration
export const API_CONFIG = {
  BASE_URL: config.api.baseUrl,
  TIMEOUT: config.api.timeout,
  RETRY_ATTEMPTS: config.api.retryAttempts,
};

// Score Thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 50,
  POOR: 0,
};

// Score Colors
export const SCORE_COLORS = {
  EXCELLENT: '#22c55e', // green-500
  GOOD: '#f59e0b', // amber-500
  POOR: '#ef4444', // red-500
};

// Issue Categories
export const ISSUE_CATEGORIES = {
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  BEST_PRACTICES: 'best-practices',
  SEO: 'seo',
};

// Issue Impact Levels
export const IMPACT_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// Impact Thresholds by Category
export const IMPACT_THRESHOLDS = {
  [ISSUE_CATEGORIES.PERFORMANCE]: {
    [IMPACT_LEVELS.CRITICAL]: 25,
    [IMPACT_LEVELS.HIGH]: 15,
    [IMPACT_LEVELS.MEDIUM]: 8,
  },
  [ISSUE_CATEGORIES.ACCESSIBILITY]: {
    [IMPACT_LEVELS.CRITICAL]: 15,
    [IMPACT_LEVELS.HIGH]: 10,
    [IMPACT_LEVELS.MEDIUM]: 5,
  },
  [ISSUE_CATEGORIES.BEST_PRACTICES]: {
    [IMPACT_LEVELS.CRITICAL]: 20,
    [IMPACT_LEVELS.HIGH]: 12,
    [IMPACT_LEVELS.MEDIUM]: 6,
  },
  [ISSUE_CATEGORIES.SEO]: {
    [IMPACT_LEVELS.CRITICAL]: 18,
    [IMPACT_LEVELS.HIGH]: 10,
    [IMPACT_LEVELS.MEDIUM]: 5,
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ANALYSIS_RESULTS: 'fastfix_analysis_results',
  AI_ANALYSIS: 'fastfix_ai_analysis',
  AI_FIXES: 'fastfix_ai_fixes',
  SCAN_STATS: 'fastfix_scan_stats',
  SCANNED_ELEMENTS: 'fastfix_scanned_elements',
  ELEMENT_ISSUES: 'fastfix_element_issues',
  WEBSITE_URL: 'fastfix_website_url',
};

// Performance Metrics
export const PERFORMANCE_METRICS = [
  { key: 'fcp', label: 'First Contentful Paint' },
  { key: 'lcp', label: 'Largest Contentful Paint' },
  { key: 'tbt', label: 'Total Blocking Time' },
  { key: 'cls', label: 'Cumulative Layout Shift' },
  { key: 'si', label: 'Speed Index' },
  { key: 'tti', label: 'Time to Interactive' },
];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  AI_UNAVAILABLE:
    'AI service is currently unavailable. Please try again later.',
  ANALYSIS_FAILED:
    'Website analysis failed. Please check the URL and try again.',
  INVALID_URL: 'Please enter a valid website URL.',
  GITHUB_CONFIG_MISSING:
    'GitHub configuration is missing. Please set up your GitHub integration.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
};
