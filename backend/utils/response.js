/**
 * Response utility for standardized API responses
 * Provides consistent response structures across all endpoints
 */

/**
 * @typedef {Object} SuccessResponse
 * @property {boolean} success - Always true for success responses
 * @property {string} message - Success message
 * @property {*} data - Response data
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {boolean} success - Always false for error responses
 * @property {string} error - Error message
 * @property {string} code - Error code
 * @property {string} timestamp - ISO timestamp
 * @property {string} [stack] - Stack trace (development only)
 * @property {*} [details] - Additional error details
 */

/**
 * @typedef {Object} ProgressResponse
 * @property {string} message - Progress message
 * @property {number} progress - Progress percentage (0-100)
 * @property {*} [data] - Additional progress data
 */

/**
 * Create a standardized success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {SuccessResponse} Standardized success response
 *
 * @example
 * res.json(successResponse({ results: [...] }, 'Analysis completed'));
 */
export const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Create a standardized error response
 * @param {Error|string} error - Error object or message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code (optional, for reference)
 * @returns {ErrorResponse} Standardized error response
 *
 * @example
 * res.status(400).json(errorResponse('Invalid URL', 'VALIDATION_ERROR'));
 */
export const errorResponse = (
  error,
  code = 'INTERNAL_ERROR',
  statusCode = 500
) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const response = {
    success: false,
    error: errorMessage,
    code,
    timestamp: new Date().toISOString(),
  };

  // Get environment from process.env
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  // Add additional details if available
  if (error.details) {
    response.details = error.details;
  }

  return response;
};

/**
 * Create a standardized progress response for SSE
 * @param {string} message - Progress message
 * @param {number} progress - Progress percentage (0-100)
 * @param {Object} data - Additional progress data
 * @returns {ProgressResponse} Standardized progress response
 *
 * @example
 * sendSSE(res, progressResponse('Running Lighthouse...', 25, { stage: 'lighthouse' }));
 */
export const progressResponse = (message, progress, data = {}) => ({
  message,
  progress: Math.min(100, Math.max(0, progress)), // Clamp between 0-100
  timestamp: new Date().toISOString(),
  ...data,
});

/**
 * Create a completion response for SSE
 * @param {*} data - Final result data
 * @param {string} message - Completion message
 * @returns {Object} Completion response with done flag
 *
 * @example
 * sendSSE(res, completionResponse(results, 'Analysis complete'));
 */
export const completionResponse = (data, message = 'Complete') => ({
  done: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Send SSE (Server-Sent Events) message
 * @param {Response} res - Express response object
 * @param {Object} data - Data to send
 *
 * @example
 * sendSSE(res, progressResponse('Processing...', 50));
 */
export const sendSSE = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

/**
 * Setup SSE headers for streaming responses
 * @param {Response} res - Express response object
 *
 * @example
 * setupSSE(res);
 * sendSSE(res, progressResponse('Starting...', 0));
 */
export const setupSSE = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();
};

/**
 * Create a paginated response
 * @param {Array} items - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Paginated response
 *
 * @example
 * res.json(successResponse(
 *   paginatedResponse(items, 1, 10, 100),
 *   'Items retrieved'
 * ));
 */
export const paginatedResponse = (items, page, limit, total) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});
