/**
 * Centralized error handling utility
 * Provides user-friendly error messages and error tracking
 */

import logger from './logger';

// Error types for categorization
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  API: 'API',
  VALIDATION: 'VALIDATION',
  AI_PROVIDER: 'AI_PROVIDER',
  ANALYSIS: 'ANALYSIS',
  SCREENSHOT: 'SCREENSHOT',
  GITHUB: 'GITHUB',
  UNKNOWN: 'UNKNOWN',
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [ErrorTypes.NETWORK]: {
    title: 'Connection Error',
    message:
      'Unable to connect to the server. Please check your internet connection.',
    action: 'Try again',
  },
  [ErrorTypes.API]: {
    title: 'API Error',
    message: 'The server encountered an error. Please try again later.',
    action: 'Retry',
  },
  [ErrorTypes.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'Fix input',
  },
  [ErrorTypes.AI_PROVIDER]: {
    title: 'AI Service Error',
    message:
      'The AI service is temporarily unavailable. Analysis will continue without AI insights.',
    action: 'Continue',
  },
  [ErrorTypes.ANALYSIS]: {
    title: 'Analysis Failed',
    message:
      'Unable to analyze the website. Please verify the URL and try again.',
    action: 'Try again',
  },
  [ErrorTypes.SCREENSHOT]: {
    title: 'Screenshot Failed',
    message: 'Unable to capture screenshot. Continuing with analysis.',
    action: 'Continue',
  },
  [ErrorTypes.GITHUB]: {
    title: 'GitHub Error',
    message: 'Unable to connect to GitHub. Please check your credentials.',
    action: 'Check settings',
  },
  [ErrorTypes.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.',
    action: 'Try again',
  },
};

/**
 * Error class with user-friendly messages
 */
export class AppError extends Error {
  constructor(type, message, originalError = null, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.userMessage =
      ERROR_MESSAGES[type] || ERROR_MESSAGES[ErrorTypes.UNKNOWN];
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Handle errors and return user-friendly messages
 */
export function handleError(error, context = {}) {
  // Determine error type
  let errorType = ErrorTypes.UNKNOWN;
  let userMessage = '';

  if (error instanceof AppError) {
    errorType = error.type;
    userMessage = error.userMessage.message;
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    errorType = ErrorTypes.NETWORK;
    userMessage = ERROR_MESSAGES[ErrorTypes.NETWORK].message;
  } else if (error.response) {
    // API error with response
    errorType = ErrorTypes.API;
    userMessage =
      error.response.data?.message || ERROR_MESSAGES[ErrorTypes.API].message;
  } else if (error.message) {
    userMessage = error.message;
  } else {
    userMessage = ERROR_MESSAGES[ErrorTypes.UNKNOWN].message;
  }

  // Log the error
  logger.error(`Error: ${errorType}`, error, context);

  // Return user-friendly error object
  return {
    type: errorType,
    message: userMessage,
    title: ERROR_MESSAGES[errorType]?.title || 'Error',
    action: ERROR_MESSAGES[errorType]?.action || 'Try again',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create specific error types
 */
export const createNetworkError = (message, originalError, context) =>
  new AppError(ErrorTypes.NETWORK, message, originalError, context);

export const createAPIError = (message, originalError, context) =>
  new AppError(ErrorTypes.API, message, originalError, context);

export const createValidationError = (message, context) =>
  new AppError(ErrorTypes.VALIDATION, message, null, context);

export const createAIProviderError = (message, originalError, context) =>
  new AppError(ErrorTypes.AI_PROVIDER, message, originalError, context);

export const createAnalysisError = (message, originalError, context) =>
  new AppError(ErrorTypes.ANALYSIS, message, originalError, context);

export const createScreenshotError = (message, originalError, context) =>
  new AppError(ErrorTypes.SCREENSHOT, message, originalError, context);

export const createGitHubError = (message, originalError, context) =>
  new AppError(ErrorTypes.GITHUB, message, originalError, context);

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error) {
  if (error instanceof AppError) {
    return [
      ErrorTypes.NETWORK,
      ErrorTypes.AI_PROVIDER,
      ErrorTypes.SCREENSHOT,
    ].includes(error.type);
  }
  return false;
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error) {
  const handled = handleError(error);
  return {
    title: handled.title,
    message: handled.message,
    action: handled.action,
    recoverable: isRecoverableError(error),
  };
}

/**
 * Retry helper for recoverable errors
 */
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRecoverableError(error) || attempt === maxRetries) {
        throw error;
      }

      logger.warn(`Retry attempt ${attempt}/${maxRetries}`, {
        error: error.message,
        nextRetryIn: delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
}

export default {
  handleError,
  createNetworkError,
  createAPIError,
  createValidationError,
  createAIProviderError,
  createAnalysisError,
  createScreenshotError,
  createGitHubError,
  isRecoverableError,
  formatErrorForDisplay,
  retryOperation,
  ErrorTypes,
  AppError,
};
