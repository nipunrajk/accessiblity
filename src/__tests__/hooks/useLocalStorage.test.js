/**
 * Example Hook Test - useLocalStorage
 *
 * This is an example test file demonstrating how to test React hooks.
 * Uses React Testing Library's renderHook utility.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLocalStorage from '../../hooks/useLocalStorage.js';

describe('useLocalStorage Hook', () => {
  const TEST_KEY = 'test-key';
  const TEST_VALUE = { data: 'test' };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorage(TEST_KEY, TEST_VALUE)
      );

      expect(result.current[0]).toEqual(TEST_VALUE);
    });

    it('should return stored value when localStorage has data', () => {
      const storedValue = { data: 'stored' };
      localStorage.setItem(TEST_KEY, JSON.stringify(storedValue));

      const { result } = renderHook(() =>
        useLocalStorage(TEST_KEY, TEST_VALUE)
      );

      expect(result.current[0]).toEqual(storedValue);
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem(TEST_KEY, 'invalid json');

      const { result } = renderHook(() =>
        useLocalStorage(TEST_KEY, TEST_VALUE)
      );

      // Should fall back to initial value
      expect(result.current[0]).toEqual(TEST_VALUE);
    });
  });

  describe('setValue', () => {
    it('should update value and localStorage', () => {
      const { result } = renderHook(() =>
        useLocalStorage(TEST_KEY, TEST_VALUE)
      );

      const newValue = { data: 'updated' };

      act(() => {
        result.current[1](newValue);
      });

      expect(result.current[0]).toEqual(newValue);
      expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(newValue));
    });

    it('should handle function updates', () => {
      const { result } = renderHook(() =>
        useLocalStorage(TEST_KEY, { count: 0 })
      );

      act(() => {
        result.current[1]((prev) => ({ count: prev.count + 1 }));
      });

      expect(result.current[0]).toEqual({ count: 1 });
    });

    it('should handle null values', () => {
      const { result } = renderHook(() =>
        useLocalStorage(TEST_KEY, TEST_VALUE)
      );

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBeNull();
      expect(localStorage.getItem(TEST_KEY)).toBe('null');
    });
  });

  describe('persistence', () => {
    it('should persist across hook re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage(TEST_KEY, TEST_VALUE)
      );

      const newValue = { data: 'persisted' };

      act(() => {
        result.current[1](newValue);
      });

      rerender();

      expect(result.current[0]).toEqual(newValue);
    });

    it('should sync with localStorage changes', () => {
      const { result } = renderHook(() =>
        useLocalStorage(TEST_KEY, TEST_VALUE)
      );

      const newValue = { data: 'external' };
      localStorage.setItem(TEST_KEY, JSON.stringify(newValue));

      // Trigger storage event
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: TEST_KEY,
          newValue: JSON.stringify(newValue),
        })
      );

      expect(result.current[0]).toEqual(newValue);
    });
  });
});
