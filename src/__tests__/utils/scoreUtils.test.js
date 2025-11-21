/**
 * Example Unit Test - Score Utilities
 *
 * This is an example test file demonstrating how to test utility functions.
 * Tests focus on core functionality without mocking.
 */

import { describe, it, expect } from 'vitest';
import { getScoreColor, getScoreLabel } from '../../utils/scoreUtils.js';

describe('Score Utilities', () => {
  describe('getScoreColor', () => {
    it('should return green for excellent scores (90+)', () => {
      const color = getScoreColor(95);
      expect(color).toBe('#22c55e');
    });

    it('should return amber for good scores (50-89)', () => {
      const color = getScoreColor(70);
      expect(color).toBe('#f59e0b');
    });

    it('should return red for poor scores (<50)', () => {
      const color = getScoreColor(30);
      expect(color).toBe('#ef4444');
    });

    it('should handle edge case at 90', () => {
      const color = getScoreColor(90);
      expect(color).toBe('#22c55e');
    });

    it('should handle edge case at 50', () => {
      const color = getScoreColor(50);
      expect(color).toBe('#f59e0b');
    });

    it('should handle score of 0', () => {
      const color = getScoreColor(0);
      expect(color).toBe('#ef4444');
    });

    it('should handle score of 100', () => {
      const color = getScoreColor(100);
      expect(color).toBe('#22c55e');
    });
  });

  describe('getScoreLabel', () => {
    it('should return "Excellent" for scores 90+', () => {
      const label = getScoreLabel(95);
      expect(label).toBe('Excellent');
    });

    it('should return "Good" for scores 50-89', () => {
      const label = getScoreLabel(70);
      expect(label).toBe('Good');
    });

    it('should return "Needs Improvement" for scores <50', () => {
      const label = getScoreLabel(30);
      expect(label).toBe('Needs Improvement');
    });

    it('should handle edge cases correctly', () => {
      expect(getScoreLabel(90)).toBe('Excellent');
      expect(getScoreLabel(50)).toBe('Good');
      expect(getScoreLabel(49)).toBe('Needs Improvement');
    });
  });
});
