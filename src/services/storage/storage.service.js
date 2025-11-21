/**
 * Storage Service
 * Centralized localStorage management with error handling and JSON serialization
 *
 * @example
 * import storageService from './services/storage/storage.service.js';
 *
 * // Set a value
 * storageService.set('user', { name: 'John' });
 *
 * // Get a value
 * const user = storageService.get('user', { name: 'Guest' });
 *
 * // Remove a value
 * storageService.remove('user');
 *
 * // Clear all values
 * storageService.clear();
 */

import logger from '../../utils/logger.js';

class StorageService {
  /**
   * Create a new StorageService instance
   * @param {string} prefix - Prefix for all storage keys (default: 'fastfix_')
   */
  constructor(prefix = 'fastfix_') {
    this.prefix = prefix;
    this.isAvailable = this._checkAvailability();
  }

  /**
   * Check if localStorage is available
   * @private
   * @returns {boolean} True if localStorage is available
   */
  _checkAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('localStorage is not available', { error: error.message });
      return false;
    }
  }

  /**
   * Get the full key with prefix
   * @private
   * @param {string} key - The key without prefix
   * @returns {string} The key with prefix
   */
  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set a value in localStorage
   * @param {string} key - The key to store the value under
   * @param {*} value - The value to store (will be JSON serialized)
   * @returns {boolean} True if successful, false otherwise
   */
  set(key, value) {
    if (!this.isAvailable) {
      logger.warn('Cannot set storage value: localStorage unavailable', {
        key,
      });
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this._getKey(key), serializedValue);
      logger.debug('Storage set successful', { key });
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded', error, { key });
        // Attempt to clear old data to make space
        this._handleQuotaExceeded();
      } else {
        logger.error('Storage set failed', error, { key });
      }
      return false;
    }
  }

  /**
   * Get a value from localStorage
   * @param {string} key - The key to retrieve
   * @param {*} defaultValue - Default value if key doesn't exist or parsing fails
   * @returns {*} The stored value or defaultValue
   */
  get(key, defaultValue = null) {
    if (!this.isAvailable) {
      logger.warn('Cannot get storage value: localStorage unavailable', {
        key,
      });
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(this._getKey(key));

      if (item === null) {
        return defaultValue;
      }

      const parsedValue = JSON.parse(item);
      logger.debug('Storage get successful', { key });
      return parsedValue;
    } catch (error) {
      logger.error('Storage get failed', error, { key });
      return defaultValue;
    }
  }

  /**
   * Remove a value from localStorage
   * @param {string} key - The key to remove
   * @returns {boolean} True if successful, false otherwise
   */
  remove(key) {
    if (!this.isAvailable) {
      logger.warn('Cannot remove storage value: localStorage unavailable', {
        key,
      });
      return false;
    }

    try {
      localStorage.removeItem(this._getKey(key));
      logger.debug('Storage remove successful', { key });
      return true;
    } catch (error) {
      logger.error('Storage remove failed', error, { key });
      return false;
    }
  }

  /**
   * Clear all values with the service prefix
   * @returns {boolean} True if successful, false otherwise
   */
  clear() {
    if (!this.isAvailable) {
      logger.warn('Cannot clear storage: localStorage unavailable');
      return false;
    }

    try {
      const keysToRemove = [];

      // Find all keys with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      // Remove all matching keys
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      logger.info('Storage cleared', { count: keysToRemove.length });
      return true;
    } catch (error) {
      logger.error('Storage clear failed', error);
      return false;
    }
  }

  /**
   * Get all keys with the service prefix
   * @returns {string[]} Array of keys (without prefix)
   */
  keys() {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const keys = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          // Remove prefix from key
          keys.push(key.substring(this.prefix.length));
        }
      }

      return keys;
    } catch (error) {
      logger.error('Storage keys retrieval failed', error);
      return [];
    }
  }

  /**
   * Check if a key exists in storage
   * @param {string} key - The key to check
   * @returns {boolean} True if key exists
   */
  has(key) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      return localStorage.getItem(this._getKey(key)) !== null;
    } catch (error) {
      logger.error('Storage has check failed', error, { key });
      return false;
    }
  }

  /**
   * Handle quota exceeded error by clearing old data
   * @private
   */
  _handleQuotaExceeded() {
    logger.warn('Attempting to clear old storage data due to quota exceeded');

    try {
      // Clear all data with our prefix as a last resort
      this.clear();
      logger.info('Old storage data cleared to free up space');
    } catch (error) {
      logger.error('Failed to clear old storage data', error);
    }
  }

  /**
   * Get the approximate size of stored data in bytes
   * @returns {number} Approximate size in bytes
   */
  getSize() {
    if (!this.isAvailable) {
      return 0;
    }

    try {
      let size = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          size += key.length + (value ? value.length : 0);
        }
      }

      return size;
    } catch (error) {
      logger.error('Storage size calculation failed', error);
      return 0;
    }
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;
