/**
 * Backend error handling utility
 * Provides consistent error responses and logging
 */

import logger from './logger.js';

// Error types
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT: 'RATE_LIMIT',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  DATABASE: 'DATABASE_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
};

// HTTP status codes
export const StatusCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(type, message, statusCode = 500, details = {}) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: false,
      error: {
        type: this.type,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Create specific error types
 */
export const createValidationError = (message, details) =>
  new APIError(
    ErrorTypes.VALIDATION,
    message,
    StatusCodes.BAD_REQUEST,
    details
  );

export const createNotFoundError = (resource) =>
  new APIError(
    ErrorTypes.NOT_FOUND,
    `${resource} not found`,
    StatusCodes.NOT_FOUND
  );

export const createUnauthorizedError = (message = 'Unauthorized') =>
  new APIError(ErrorTypes.UNAUTHORIZED, message, StatusCodes.UNAUTHORIZED);

export const createForbiddenError = (message = 'Forbidden') =>
  new APIError(ErrorTypes.FORBIDDEN, message, StatusCodes.FORBIDDEN);

export const createRateLimitError = (message = 'Rate limit exceeded') =>
  new APIError(ErrorTypes.RATE_LIMIT, message, StatusCodes.RATE_LIMIT);

export const createExternalAPIError = (service, originalError) =>
  new APIError(
    ErrorTypes.EXTERNAL_API,
    `External service error: ${service}`,
    StatusCodes.SERVICE_UNAVAILABLE,
    { service, originalError: originalError?.message }
  );

export const createInternalError = (message, details) =>
  new APIError(
    ErrorTypes.INTERNAL,
    message,
    StatusCodes.INTERNAL_ERROR,
    details
  );

/**
 * Handle errors and send appropriate response
 */
export function handleError(error, req, res) {
  // Log the error
  logger.error('Request error', error, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Handle known error types
  if (error instanceof APIError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        type: ErrorTypes.VALIDATION,
        message: error.message,
        details: error.details || {},
      },
    });
  }

  // Handle unknown errors
  const statusCode = error.statusCode || StatusCodes.INTERNAL_ERROR;

  // Get environment from process.env
  const isDevelopment = process.env.NODE_ENV === 'development';

  const message = isDevelopment
    ? error.message
    : 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      type: ErrorTypes.INTERNAL,
      message,
      ...(isDevelopment && {
        stack: error.stack,
      }),
    },
  });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error handling middleware
 */
export function errorMiddleware(err, req, res, next) {
  handleError(err, req, res);
}

/**
 * Wrap external API calls with error handling
 */
export async function wrapExternalAPI(serviceName, apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    logger.error(`External API error: ${serviceName}`, error);
    throw createExternalAPIError(serviceName, error);
  }
}

/**
 * Validate required fields
 */
export function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw createValidationError('Missing required fields', {
      missing,
      received: Object.keys(data),
    });
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn('JSON parse error', { error: error.message });
    return fallback;
  }
}

export default {
  APIError,
  ErrorTypes,
  StatusCodes,
  handleError,
  asyncHandler,
  errorMiddleware,
  wrapExternalAPI,
  validateRequired,
  safeJSONParse,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createRateLimitError,
  createExternalAPIError,
  createInternalError,
};
