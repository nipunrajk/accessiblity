import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { memoize, memoizeAsync } from '../../utils/memoize.js';

describe('memoize', () => {
  describe('basic caching', () => {
    it('should cache function results', () => {
      const fn = vi.fn((a, b) => a + b);
      const memoized = memoize(fn);

      const result1 = memoized(2, 3);
      const result2 = memoized(2, 3);

      expect(result1).toBe(5);
      expect(result2).toBe(5);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should compute different results for different arguments', () => {
      const fn = vi.fn((a, b) => a + b);
      const memoized = memoize(fn);

      const result1 = memoized(2, 3);
      const result2 = memoized(4, 5);

      expect(result1).toBe(5);
      expect(result2).toBe(9);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle single argument', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);
      memoized(5);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle no arguments', () => {
      const fn = vi.fn(() => 42);
      const memoized = memoize(fn);

      const result1 = memoized();
      const result2 = memoized();

      expect(result1).toBe(42);
      expect(result2).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const fn = vi.fn((a, b, c, d) => a + b + c + d);
      const memoized = memoize(fn);

      memoized(1, 2, 3, 4);
      memoized(1, 2, 3, 4);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);
      memoized(5);
      memoized(5);

      const stats = memoized.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should track cache misses', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(1);
      memoized(2);
      memoized(3);

      const stats = memoized.stats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(3);
    });

    it('should calculate hit rate correctly', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);
      memoized(5);
      memoized(5);
      memoized(10);

      const stats = memoized.stats();
      expect(stats.hitRate).toBe(0.5); // 2 hits out of 4 total
    });

    it('should track cache size', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(1);
      memoized(2);
      memoized(3);

      const stats = memoized.stats();
      expect(stats.size).toBe(3);
    });

    it('should return 0 hit rate when no calls made', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      const stats = memoized.stats();
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);
      memoized(5);
      memoized.clear();
      memoized(5);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should reset stats on clear', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);
      memoized(5);
      memoized.clear();

      const stats = memoized.stats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should check if key exists in cache', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);

      expect(memoized.has(5)).toBe(true);
      expect(memoized.has(10)).toBe(false);
    });

    it('should delete specific cache entry', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);
      memoized(10);

      expect(memoized.delete(5)).toBe(true);
      expect(memoized.has(5)).toBe(false);
      expect(memoized.has(10)).toBe(true);
    });

    it('should return false when deleting non-existent entry', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      expect(memoized.delete(999)).toBe(false);
    });
  });

  describe('maxSize option', () => {
    it('should respect maxSize limit', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn, { maxSize: 3 });

      memoized(1);
      memoized(2);
      memoized(3);
      memoized(4);

      const stats = memoized.stats();
      expect(stats.size).toBe(3);
    });

    it('should evict oldest entry when maxSize reached', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn, { maxSize: 2 });

      memoized(1);
      memoized(2);
      memoized(3);

      expect(memoized.has(1)).toBe(false);
      expect(memoized.has(2)).toBe(true);
      expect(memoized.has(3)).toBe(true);
    });

    it('should handle maxSize of 1', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn, { maxSize: 1 });

      memoized(1);
      memoized(2);

      const stats = memoized.stats();
      expect(stats.size).toBe(1);
      expect(memoized.has(2)).toBe(true);
    });
  });

  describe('TTL (time to live)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire cache entries after TTL', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn, { ttl: 1000 });

      memoized(5);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);
      memoized(5);
      expect(fn).toHaveBeenCalledTimes(1); // Still cached

      vi.advanceTimersByTime(600);
      memoized(5);
      expect(fn).toHaveBeenCalledTimes(2); // Expired, recomputed
    });

    it('should not expire if TTL not set', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn);

      memoized(5);
      vi.advanceTimersByTime(999999);
      memoized(5);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should remove expired entry from cache', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn, { ttl: 1000 });

      memoized(5);
      vi.advanceTimersByTime(1100);
      memoized(5);

      expect(memoized.has(5)).toBe(true); // New entry
    });

    it('should handle multiple entries with different expiration times', () => {
      const fn = vi.fn((x) => x * 2);
      const memoized = memoize(fn, { ttl: 1000 });

      memoized(1);
      vi.advanceTimersByTime(500);
      memoized(2);
      vi.advanceTimersByTime(600);

      // Entry 1 expired, entry 2 still valid
      expect(memoized.has(1)).toBe(false);
      expect(memoized.has(2)).toBe(true);
    });
  });

  describe('custom key generator', () => {
    it('should use custom key generator', () => {
      const fn = vi.fn((obj) => obj.value * 2);
      const keyGen = (obj) => obj.id;
      const memoized = memoize(fn, { keyGenerator: keyGen });

      memoized({ id: 1, value: 5 });
      memoized({ id: 1, value: 10 }); // Different value, same id

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle complex objects with custom key', () => {
      const fn = vi.fn((user) => `Hello ${user.name}`);
      const keyGen = (user) => user.id;
      const memoized = memoize(fn, { keyGenerator: keyGen });

      const result1 = memoized({ id: 1, name: 'Alice', age: 30 });
      const result2 = memoized({ id: 1, name: 'Alice', age: 31 });

      expect(result1).toBe('Hello Alice');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should work with multiple arguments in key generator', () => {
      const fn = vi.fn((a, b) => a + b);
      const keyGen = (a, b) => `${a}-${b}`;
      const memoized = memoize(fn, { keyGenerator: keyGen });

      memoized(2, 3);
      memoized(2, 3);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle null return values', () => {
      const fn = vi.fn(() => null);
      const memoized = memoize(fn);

      const result1 = memoized();
      const result2 = memoized();

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined return values', () => {
      const fn = vi.fn(() => undefined);
      const memoized = memoize(fn);

      const result1 = memoized();
      const result2 = memoized();

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle object return values', () => {
      const fn = vi.fn(() => ({ value: 42 }));
      const memoized = memoize(fn);

      const result1 = memoized();
      const result2 = memoized();

      expect(result1).toEqual({ value: 42 });
      expect(result1).toBe(result2); // Same reference
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle array return values', () => {
      const fn = vi.fn(() => [1, 2, 3]);
      const memoized = memoize(fn);

      const result1 = memoized();
      const result2 = memoized();

      expect(result1).toEqual([1, 2, 3]);
      expect(result1).toBe(result2);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle functions that throw errors', () => {
      const fn = vi.fn(() => {
        throw new Error('Test error');
      });
      const memoized = memoize(fn);

      expect(() => memoized()).toThrow('Test error');
      expect(() => memoized()).toThrow('Test error');
      expect(fn).toHaveBeenCalledTimes(2); // Error not cached
    });
  });
});

describe('memoizeAsync', () => {
  describe('basic async caching', () => {
    it('should cache async function results', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      const result1 = await memoized(5);
      const result2 = await memoized(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should compute different results for different arguments', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      const result1 = await memoized(5);
      const result2 = await memoized(10);

      expect(result1).toBe(10);
      expect(result2).toBe(20);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle promises that resolve to objects', async () => {
      const fn = vi.fn(async (id) => ({ id, data: 'test' }));
      const memoized = memoizeAsync(fn);

      const result1 = await memoized(1);
      const result2 = await memoized(1);

      expect(result1).toEqual({ id: 1, data: 'test' });
      expect(result1).toBe(result2);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent request deduplication', () => {
    it('should deduplicate concurrent requests', async () => {
      let callCount = 0;
      const fn = vi.fn(async (x) => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return x * 2;
      });
      const memoized = memoizeAsync(fn);

      const [result1, result2, result3] = await Promise.all([
        memoized(5),
        memoized(5),
        memoized(5),
      ]);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should track pending requests', async () => {
      const fn = vi.fn(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return x * 2;
      });
      const memoized = memoizeAsync(fn);

      const promise1 = memoized(5);
      const promise2 = memoized(5);

      const stats = memoized.stats();
      expect(stats.pending).toBe(1);

      await Promise.all([promise1, promise2]);

      const statsAfter = memoized.stats();
      expect(statsAfter.pending).toBe(0);
    });

    it('should handle different concurrent requests separately', async () => {
      const fn = vi.fn(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return x * 2;
      });
      const memoized = memoizeAsync(fn);

      const [result1, result2] = await Promise.all([memoized(5), memoized(10)]);

      expect(result1).toBe(10);
      expect(result2).toBe(20);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should not cache rejected promises', async () => {
      const fn = vi.fn(async () => {
        throw new Error('Test error');
      });
      const memoized = memoizeAsync(fn);

      await expect(memoized()).rejects.toThrow('Test error');
      await expect(memoized()).rejects.toThrow('Test error');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should remove pending promise on error', async () => {
      const fn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        throw new Error('Test error');
      });
      const memoized = memoizeAsync(fn);

      const promise = memoized();
      expect(memoized.stats().pending).toBe(1);

      await expect(promise).rejects.toThrow('Test error');
      expect(memoized.stats().pending).toBe(0);
    });

    it('should allow retry after error', async () => {
      let shouldFail = true;
      const fn = vi.fn(async (x) => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('First call fails');
        }
        return x * 2;
      });
      const memoized = memoizeAsync(fn);

      await expect(memoized(5)).rejects.toThrow('First call fails');
      const result = await memoized(5);

      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(5);
      await memoized(5);
      await memoized(5);

      const stats = memoized.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should track cache misses', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(1);
      await memoized(2);
      await memoized(3);

      const stats = memoized.stats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(3);
    });

    it('should calculate hit rate correctly', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(5);
      await memoized(5);
      await memoized(10);

      const stats = memoized.stats();
      expect(stats.hitRate).toBe(1 / 3);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(5);
      await memoized(5);
      memoized.clear();
      await memoized(5);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should reset stats on clear', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(5);
      await memoized(5);
      memoized.clear();

      const stats = memoized.stats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
      expect(stats.pending).toBe(0);
    });

    it('should check if key exists in cache', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(5);

      expect(memoized.has(5)).toBe(true);
      expect(memoized.has(10)).toBe(false);
    });

    it('should delete specific cache entry', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(5);
      await memoized(10);

      expect(memoized.delete(5)).toBe(true);
      expect(memoized.has(5)).toBe(false);
      expect(memoized.has(10)).toBe(true);
    });
  });

  describe('maxSize option', () => {
    it('should respect maxSize limit', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn, { maxSize: 3 });

      await memoized(1);
      await memoized(2);
      await memoized(3);
      await memoized(4);

      const stats = memoized.stats();
      expect(stats.size).toBe(3);
    });

    it('should evict oldest entry when maxSize reached', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn, { maxSize: 2 });

      await memoized(1);
      await memoized(2);
      await memoized(3);

      expect(memoized.has(1)).toBe(false);
      expect(memoized.has(2)).toBe(true);
      expect(memoized.has(3)).toBe(true);
    });
  });

  describe('TTL (time to live)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire cache entries after TTL', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn, { ttl: 1000 });

      await memoized(5);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);
      await memoized(5);
      expect(fn).toHaveBeenCalledTimes(1); // Still cached

      vi.advanceTimersByTime(600);
      await memoized(5);
      expect(fn).toHaveBeenCalledTimes(2); // Expired, recomputed
    });

    it('should not expire if TTL not set', async () => {
      const fn = vi.fn(async (x) => x * 2);
      const memoized = memoizeAsync(fn);

      await memoized(5);
      vi.advanceTimersByTime(999999);
      await memoized(5);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom key generator', () => {
    it('should use custom key generator', async () => {
      const fn = vi.fn(async (obj) => obj.value * 2);
      const keyGen = (obj) => obj.id;
      const memoized = memoizeAsync(fn, { keyGenerator: keyGen });

      await memoized({ id: 1, value: 5 });
      await memoized({ id: 1, value: 10 });

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle null return values', async () => {
      const fn = vi.fn(async () => null);
      const memoized = memoizeAsync(fn);

      const result1 = await memoized();
      const result2 = await memoized();

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined return values', async () => {
      const fn = vi.fn(async () => undefined);
      const memoized = memoizeAsync(fn);

      const result1 = await memoized();
      const result2 = await memoized();

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
