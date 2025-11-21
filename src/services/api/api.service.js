/**
 * Base API Service
 * Centralized API communication with error handling, retry logic, and interceptors
 */

import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';
import { createNetworkError } from '../../utils/errorHandler.js';

/**
 * @typedef {Object} RequestOptions
 * @property {string} [method] - HTTP method
 * @property {Object} [headers] - Request headers
 * @property {any} [body] - Request body
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {number} [retryAttempts] - Number of retry attempts
 * @property {number} [retryDelay] - Delay between retries in milliseconds
 * @property {boolean} [skipRetry] - Skip retry logic
 */

class ApiService {
  constructor(baseConfig = {}) {
    this.baseURL = baseConfig.baseUrl || config.api.baseUrl;
    this.timeout = baseConfig.timeout || config.api.timeout;
    this.retryAttempts = baseConfig.retryAttempts || config.api.retryAttempts;
    this.retryDelay = baseConfig.retryDelay || config.api.retryDelay;
    this.defaultHeaders =
      baseConfig.defaultHeaders || config.api.defaultHeaders;

    // Request/Response interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Add a request interceptor
   * @param {Function} interceptor - Function that receives and returns config
   * @example
   * apiService.addRequestInterceptor((config) => {
   *   config.headers['Authorization'] = 'Bearer token';
   *   return config;
   * });
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   * @param {Function} interceptor - Function that receives and returns response
   * @example
   * apiService.addResponseInterceptor((response) => {
   *   console.log('Response received:', response);
   *   return response;
   * });
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors to config
   * @private
   */
  async _applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Apply response interceptors to response
   * @private
   */
  async _applyResponseInterceptors(response) {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Sleep utility for retry delays
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Determine if error is retryable
   * @private
   */
  _isRetryableError(error) {
    // Network errors are retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // Timeout errors are retryable
    if (error.name === 'AbortError') {
      return true;
    }

    // 5xx server errors are retryable
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // 429 Too Many Requests is retryable
    if (error.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Make an HTTP request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {RequestOptions} options - Request options
   * @returns {Promise<any>} Response data
   * @throws {Error} When request fails after all retries
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    let config = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Apply request interceptors
    config = await this._applyRequestInterceptors(config);

    const retryAttempts = options.retryAttempts ?? this.retryAttempts;
    const retryDelay = options.retryDelay ?? this.retryDelay;
    const skipRetry = options.skipRetry || false;

    let lastError;
    const maxAttempts = skipRetry ? 1 : retryAttempts + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const fetchConfig = {
          method: config.method,
          headers: config.headers,
          signal: controller.signal,
        };

        // Add body for non-GET requests
        if (config.body && config.method !== 'GET') {
          fetchConfig.body =
            typeof config.body === 'string'
              ? config.body
              : JSON.stringify(config.body);
        }

        logger.debug(`API Request [${config.method}] ${url}`, {
          attempt: attempt + 1,
          maxAttempts,
        });

        const response = await fetch(url, fetchConfig);
        clearTimeout(timeoutId);

        // Apply response interceptors
        const interceptedResponse = await this._applyResponseInterceptors(
          response
        );

        // Handle non-OK responses
        if (!interceptedResponse.ok) {
          const error = new Error(
            `HTTP ${interceptedResponse.status}: ${interceptedResponse.statusText}`
          );
          error.status = interceptedResponse.status;
          error.statusText = interceptedResponse.statusText;

          // Try to parse error body
          try {
            const contentType = interceptedResponse.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              const errorData = await interceptedResponse.json();
              error.data = errorData;
              error.message =
                errorData.error || errorData.message || error.message;
            }
          } catch (parseError) {
            // Ignore parse errors
          }

          throw error;
        }

        // Handle different content types
        const contentType = interceptedResponse.headers.get('content-type');

        if (contentType?.includes('text/event-stream')) {
          // Return response for SSE handling
          logger.success(
            `API Request successful [${config.method}] ${url} (SSE)`
          );
          return interceptedResponse;
        } else if (contentType?.includes('application/json')) {
          const data = await interceptedResponse.json();
          logger.success(`API Request successful [${config.method}] ${url}`);
          return data;
        } else {
          const text = await interceptedResponse.text();
          logger.success(`API Request successful [${config.method}] ${url}`);
          return text;
        }
      } catch (error) {
        lastError = error;

        // Log the error
        logger.warn(`API Request failed [${config.method}] ${url}`, {
          attempt: attempt + 1,
          maxAttempts,
          error: error.message,
        });

        // Check if we should retry
        const shouldRetry =
          attempt < maxAttempts - 1 && this._isRetryableError(error);

        if (shouldRetry) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          logger.debug(`Retrying in ${delay}ms...`);
          await this._sleep(delay);
          continue;
        }

        // No more retries, throw error
        break;
      }
    }

    // All retries exhausted, handle and throw error
    const networkError = createNetworkError(
      `Request failed: ${lastError.message}`,
      lastError,
      { url, method: config.method }
    );

    logger.error(
      `API Request failed after ${maxAttempts} attempts`,
      lastError,
      {
        url,
        method: config.method,
      }
    );

    throw networkError;
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {RequestOptions} options - Request options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {RequestOptions} options - Request options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {RequestOptions} options - Request options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {RequestOptions} options - Request options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Make a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {RequestOptions} options - Request options
   * @returns {Promise<any>} Response data
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }
}

// Export singleton instance
export default new ApiService();

// Export class for testing or custom instances
export { ApiService };
