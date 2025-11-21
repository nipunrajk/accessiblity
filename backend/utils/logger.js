/**
 * Logger utility for consistent logging across the application
 * Provides structured logging with different levels and context support
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(config = null) {
    // Allow config to be passed in, or load it lazily
    this.config = config;
    this.isDevelopment = this.getEnvironment() !== 'production';
    this.level = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
  }

  /**
   * Get environment from config or fallback to process.env
   * @returns {string} Environment name
   */
  getEnvironment() {
    if (this.config) {
      return this.config.app.server.env;
    }
    // Fallback for early initialization before config is loaded
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Format log message with optional context
   * @param {string} emoji - Emoji prefix for the log
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   * @returns {string} Formatted log message
   */
  formatMessage(emoji, message, context) {
    const timestamp = new Date().toISOString();
    const prefix = `${emoji} ${message}`;

    if (context && Object.keys(context).length > 0) {
      // Pretty print in development, compact in production
      const contextStr = this.isDevelopment
        ? JSON.stringify(context, null, 2)
        : JSON.stringify(context);
      return `[${timestamp}] ${prefix}\n${contextStr}`;
    }
    return `[${timestamp}] ${prefix}`;
  }

  /**
   * Log with custom context that persists across related log calls
   * @param {Object} context - Context to merge with all subsequent logs
   * @returns {Object} Logger instance with bound context
   *
   * @example
   * const requestLogger = logger.withContext({ requestId: '123', userId: 'abc' });
   * requestLogger.info('Processing request');
   * requestLogger.error('Request failed');
   */
  withContext(context) {
    return {
      debug: (message, additionalContext = {}) =>
        this.debug(message, { ...context, ...additionalContext }),
      info: (message, additionalContext = {}) =>
        this.info(message, { ...context, ...additionalContext }),
      success: (message, additionalContext = {}) =>
        this.success(message, { ...context, ...additionalContext }),
      warn: (message, additionalContext = {}) =>
        this.warn(message, { ...context, ...additionalContext }),
      error: (message, error = null, additionalContext = {}) =>
        this.error(message, error, { ...context, ...additionalContext }),
      performance: (operation, durationMs, additionalContext = {}) =>
        this.performance(operation, durationMs, {
          ...context,
          ...additionalContext,
        }),
    };
  }

  /**
   * Debug logging (development only)
   */
  debug(message, context = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('🔍', message, context));
    }
  }

  /**
   * Info logging
   */
  info(message, context = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('ℹ️ ', message, context));
    }
  }

  /**
   * Success logging
   */
  success(message, context = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('✅', message, context));
    }
  }

  /**
   * Warning logging
   */
  warn(message, context = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('⚠️ ', message, context));
    }
  }

  /**
   * Error logging
   */
  error(message, error = null, context = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      const errorContext = {
        ...context,
        ...(error && {
          error: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        }),
      };
      console.error(this.formatMessage('❌', message, errorContext));
    }
  }

  /**
   * API request logging with structured context
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} path - Request path
   * @param {Object} context - Additional context (body, query, headers, etc.)
   *
   * @example
   * logger.apiRequest('POST', '/api/analyze', { body: { url: 'https://example.com' } });
   */
  apiRequest(method, path, context = {}) {
    const requestContext = {
      method,
      path,
      timestamp: new Date().toISOString(),
      ...context,
    };
    this.debug(`🌐 API Request: ${method} ${path}`, requestContext);
  }

  /**
   * API response logging with status and duration
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {number} status - HTTP status code
   * @param {number} durationMs - Request duration in milliseconds
   * @param {Object} context - Additional context
   *
   * @example
   * logger.apiResponse('POST', '/api/analyze', 200, 1500, { size: '2.5MB' });
   */
  apiResponse(method, path, status, durationMs = null, context = {}) {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    const responseContext = {
      method,
      path,
      status,
      ...(durationMs !== null && { durationMs }),
      timestamp: new Date().toISOString(),
      ...context,
    };

    const message =
      durationMs !== null
        ? `${emoji} API Response: ${method} ${path} ${status} (${durationMs}ms)`
        : `${emoji} API Response: ${method} ${path} ${status}`;

    if (status >= 400) {
      this.warn(message, responseContext);
    } else {
      this.debug(message, responseContext);
    }
  }

  /**
   * Performance logging with detailed metrics
   * @param {string} operation - The operation being measured
   * @param {number} durationMs - Duration in milliseconds
   * @param {Object} context - Additional context (e.g., size, count)
   *
   * @example
   * logger.performance('Database Query', 150, { query: 'SELECT * FROM users', rows: 42 });
   */
  performance(operation, durationMs, context = {}) {
    const performanceLevel = durationMs > 1000 ? 'warn' : 'debug';
    const emoji = durationMs > 1000 ? '🐌' : '⏱️';

    const message = `${emoji} Performance: ${operation} completed in ${durationMs}ms`;

    if (performanceLevel === 'warn') {
      this.warn(message, context);
    } else {
      this.debug(message, context);
    }
  }

  /**
   * Start a performance timer
   * @param {string} operation - The operation being measured
   * @returns {Function} A function to call when the operation completes
   *
   * @example
   * const endTimer = logger.startTimer('API Call');
   * await fetchData();
   * endTimer({ endpoint: '/api/data' });
   */
  startTimer(operation) {
    const startTime = Date.now();
    return (context = {}) => {
      const duration = Date.now() - startTime;
      this.performance(operation, duration, context);
      return duration;
    };
  }

  /**
   * AI Provider logging
   */
  aiProvider(provider, model) {
    this.info(`🤖 AI Provider: ${provider} (${model})`);
  }

  /**
   * Server startup logging
   */
  serverStart(port, environment) {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Server Started Successfully');
    console.log('='.repeat(50));
    console.log(`📍 Port: ${port}`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log(`🔗 URL: http://localhost:${port}`);
    console.log('='.repeat(50) + '\n');
  }
}

// Export singleton instance
// Config will be loaded lazily when needed
const logger = new Logger();

// Method to update logger with config after it's loaded
logger.setConfig = function (config) {
  this.config = config;
  this.isDevelopment = this.getEnvironment() !== 'production';
  this.level = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
};

export default logger;
