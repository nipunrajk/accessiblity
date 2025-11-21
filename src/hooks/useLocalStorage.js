/**
 * useLocalStorage Hook
 * Provides a React state hook that persists to localStorage
 * Similar API to useState but with automatic localStorage synchronization
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing state with localStorage persistence
 * @template T
 * @param {string} key - localStorage key to store the value under
 * @param {T} initialValue - Initial value if no stored value exists
 * @returns {[T, Function]} Tuple of [storedValue, setValue] similar to useState
 *
 * @example
 * // Basic usage
 * const [name, setName] = useLocalStorage('userName', 'Guest');
 *
 * // Update value (persists to localStorage automatically)
 * setName('John Doe');
 *
 * // Use function updater (like useState)
 * setName(prevName => prevName.toUpperCase());
 *
 * @example
 * // With objects
 * const [user, setUser] = useLocalStorage('user', { name: '', email: '' });
 * setUser({ name: 'John', email: 'john@example.com' });
 *
 * @example
 * // With arrays
 * const [items, setItems] = useLocalStorage('items', []);
 * setItems(prevItems => [...prevItems, newItem]);
 */
export function useLocalStorage(key, initialValue) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Set value in state and localStorage
   * @param {T|Function} value - New value or function that receives previous value
   */
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
