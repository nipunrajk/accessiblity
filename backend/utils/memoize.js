/**
 * Memoization Utility
 * Caches function results to avoid redundant expensive computations
 */

/**
 * Create a memoized version of a function
 * Caches results based on function arguments
 *
 * @param {Function} fn - Function to memoize
 * @param {Object} options - Memoization options
 * @param {Function} options.keyGenerator - Custom key generator function
 * @param {number} options.maxSize - Maximum cache size (default: 100)
 * @param {number} options.ttl - Time to live in milliseconds (default: no expiration)
 * @returns {Function} Memoized function with cache management methods
 *
 * @example
 * const expensiveOperation = (a, b) => {
 *   // Complex computation
 *   return a * b;
 * };
 *
 * const memoized = memoize(expensiveOperation);
 * memoized(5, 10); // Computed
 * memoized(5, 10); // Cached result
 *
 * // Clear cache
 * memoized.clear();
 *
 * // Get cache stats
 * console.log(memoized.stats());
 */
export const memoize = (fn, options = {}) => {
  const { keyGenerator = null, maxSize = 100, ttl = null } = options;

  const cache = new Map();
  const timestamps = new Map();
  let hits = 0;
  let misses = 0;

  /**
   * Generate cache key from arguments
   * @private
   */
  const generateKey = (...args) => {
    if (keyGenerator) {
      return keyGenerator(...args);
    }
    return JSON.stringify(args);
  };

  /**
   * Check if cache entry is expired
   * @private
   */
  const isExpired = (key) => {
    if (!ttl) return false;
    const timestamp = timestamps.get(key);
    return timestamp && Date.now() - timestamp > ttl;
  };

  /**
   * Evict oldest entry if cache is full
   * @private
   */
  const evictOldest = () => {
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      timestamps.delete(firstKey);
    }
  };

  /**
   * Memoized function
   */
  const memoized = (...args) => {
    const key = generateKey(...args);

    // Check if cached and not expired
    if (cache.has(key) && !isExpired(key)) {
      hits++;
      return cache.get(key);
    }

    // Remove expired entry
    if (cache.has(key) && isExpired(key)) {
      cache.delete(key);
      timestamps.delete(key);
    }

    // Compute result
    misses++;
    const result = fn(...args);

    // Evict if necessary
    evictOldest();

    // Cache result
    cache.set(key, result);
    if (ttl) {
      timestamps.set(key, Date.now());
    }

    return result;
  };

  /**
   * Clear the cache
   */
  memoized.clear = () => {
    cache.clear();
    timestamps.clear();
    hits = 0;
    misses = 0;
  };

  /**
   * Get cache statistics
   */
  memoized.stats = () => ({
    size: cache.size,
    hits,
    misses,
    hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
  });

  /**
   * Check if a key exists in cache
   */
  memoized.has = (...args) => {
    const key = generateKey(...args);
    return cache.has(key) && !isExpired(key);
  };

  /**
   * Delete a specific cache entry
   */
  memoized.delete = (...args) => {
    const key = generateKey(...args);
    timestamps.delete(key);
    return cache.delete(key);
  };

  return memoized;
};

/**
 * Create a memoized async function
 * Handles promise caching and prevents duplicate concurrent requests
 *
 * @param {Function} fn - Async function to memoize
 * @param {Object} options - Memoization options
 * @returns {Function} Memoized async function
 *
 * @example
 * const fetchData = async (id) => {
 *   const response = await fetch(`/api/data/${id}`);
 *   return response.json();
 * };
 *
 * const memoizedFetch = memoizeAsync(fetchData, { ttl: 60000 });
 * await memoizedFetch(1); // Fetches from API
 * await memoizedFetch(1); // Returns cached result
 */
export const memoizeAsync = (fn, options = {}) => {
  const { keyGenerator = null, maxSize = 100, ttl = null } = options;

  const cache = new Map();
  const timestamps = new Map();
  const pending = new Map();
  let hits = 0;
  let misses = 0;

  const generateKey = (...args) => {
    if (keyGenerator) {
      return keyGenerator(...args);
    }
    return JSON.stringify(args);
  };

  const isExpired = (key) => {
    if (!ttl) return false;
    const timestamp = timestamps.get(key);
    return timestamp && Date.now() - timestamp > ttl;
  };

  const evictOldest = () => {
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      timestamps.delete(firstKey);
    }
  };

  const memoized = async (...args) => {
    const key = generateKey(...args);

    // Return cached result if available and not expired
    if (cache.has(key) && !isExpired(key)) {
      hits++;
      return cache.get(key);
    }

    // Remove expired entry
    if (cache.has(key) && isExpired(key)) {
      cache.delete(key);
      timestamps.delete(key);
    }

    // Return pending promise if request is in flight
    if (pending.has(key)) {
      return pending.get(key);
    }

    // Execute function and cache promise
    misses++;
    const promise = fn(...args)
      .then((result) => {
        evictOldest();
        cache.set(key, result);
        if (ttl) {
          timestamps.set(key, Date.now());
        }
        pending.delete(key);
        return result;
      })
      .catch((error) => {
        pending.delete(key);
        throw error;
      });

    pending.set(key, promise);
    return promise;
  };

  memoized.clear = () => {
    cache.clear();
    timestamps.clear();
    pending.clear();
    hits = 0;
    misses = 0;
  };

  memoized.stats = () => ({
    size: cache.size,
    pending: pending.size,
    hits,
    misses,
    hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
  });

  memoized.has = (...args) => {
    const key = generateKey(...args);
    return cache.has(key) && !isExpired(key);
  };

  memoized.delete = (...args) => {
    const key = generateKey(...args);
    timestamps.delete(key);
    pending.delete(key);
    return cache.delete(key);
  };

  return memoized;
};

export default { memoize, memoizeAsync };
