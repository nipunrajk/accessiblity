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
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.level = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
  }

  /**
   * Format log message with optional context
   */
  formatMessage(emoji, message, context) {
    const timestamp = new Date().toISOString();
    const prefix = `${emoji} ${message}`;

    if (context && Object.keys(context).length > 0) {
      return `[${timestamp}] ${prefix} ${JSON.stringify(context)}`;
    }
    return `[${timestamp}] ${prefix}`;
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
   * API request logging
   */
  apiRequest(method, path, context = {}) {
    this.debug(`API Request: ${method} ${path}`, context);
  }

  /**
   * API response logging
   */
  apiResponse(method, path, status, context = {}) {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    this.debug(`API Response: ${method} ${path} ${status}`, {
      ...context,
      status,
    });
  }

  /**
   * Performance logging
   */
  performance(operation, durationMs) {
    this.debug(`⏱️  ${operation}: ${durationMs}ms`);
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
const logger = new Logger();
export default logger;
