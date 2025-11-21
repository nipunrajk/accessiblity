import logger from '../utils/logger.js';
import { errorResponse } from '../utils/response.js';

/**
 * Error classification map
 * Maps error types to HTTP status codes and error codes
 */
const ERROR_CLASSIFICATIONS = {
  ValidationError: { statusCode: 400, code: 'VALIDATION_ERROR' },
  UnauthorizedError: { statusCode: 401, code: 'UNAUTHORIZED' },
  ForbiddenError: { statusCode: 403, code: 'FORBIDDEN' },
  NotFoundError: { statusCode: 404, code: 'NOT_FOUND' },
  ConflictError: { statusCode: 409, code: 'CONFLICT' },
  RateLimitError: { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' },
  TimeoutError: { statusCode: 408, code: 'REQUEST_TIMEOUT' },
  ServiceUnavailableError: { statusCode: 503, code: 'SERVICE_UNAVAILABLE' },
  AIProviderError: { statusCode: 502, code: 'AI_PROVIDER_ERROR' },
  AnalysisError: { statusCode: 500, code: 'ANALYSIS_ERROR' },
};

/**
 * Classify error and determine appropriate status code and error code
 * @param {Error} err - Error object
 * @returns {Object} Classification with statusCode and code
 */
const classifyError = (err) => {
  // Check if error has explicit statusCode and code
  if (err.statusCode && err.code) {
    return { statusCode: err.statusCode, code: err.code };
  }

  // Check error name against classifications
  if (ERROR_CLASSIFICATIONS[err.name]) {
    return ERROR_CLASSIFICATIONS[err.name];
  }

  // Check for common Node.js errors
  if (err.code === 'ECONNREFUSED') {
    return { statusCode: 503, code: 'SERVICE_UNAVAILABLE' };
  }
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return { statusCode: 408, code: 'REQUEST_TIMEOUT' };
  }

  // Default to internal server error
  return { statusCode: 500, code: 'INTERNAL_ERROR' };
};

/**
 * Centralized error handling middleware
 * Logs errors with context and sends standardized error responses
 *
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Build error context
  const errorContext = {
    method: req.method,
    path: req.path,
    url: req.url,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    errorName: err.name,
    errorCode: err.code,
  };

  // Classify error
  const { statusCode, code } = classifyError(err);

  // Log error with full context
  logger.error('Request failed', err, errorContext);

  // Send standardized error response
  res.status(statusCode).json(errorResponse(err, code, statusCode));
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom error classes for different error scenarios
 */

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timeout') {
    super(message, 408, 'REQUEST_TIMEOUT');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class AIProviderError extends AppError {
  constructor(message = 'AI provider error', details = null) {
    super(message, 502, 'AI_PROVIDER_ERROR', details);
  }
}

export class AnalysisError extends AppError {
  constructor(message = 'Analysis failed', details = null) {
    super(message, 500, 'ANALYSIS_ERROR', details);
  }
}
