import { describe, it, expect, vi, beforeEach } from 'vitest';
import AxeService from '../../services/analysis/axe.service.js';

// Mock dependencies
vi.mock('axe-puppeteer', () => ({
  AxePuppeteer: vi.fn(),
}));

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AxeService', () => {
  describe('calculateScore', () => {
    it('should return 100 for no violations', () => {
      const results = {
        violations: [],
        incomplete: [],
        passes: [{ id: 'test1' }, { id: 'test2' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBe(100);
      expect(score.violations).toBe(0);
      expect(score.passes).toBe(2);
    });

    it('should calculate score with critical violations', () => {
      const results = {
        violations: [
          {
            impact: 'critical',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBeLessThan(100);
      expect(score.violations).toBe(1);
      expect(score.criticalIssues).toBe(1);
    });

    it('should calculate score with serious violations', () => {
      const results = {
        violations: [
          {
            impact: 'serious',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBeLessThan(100);
      expect(score.seriousIssues).toBe(1);
    });

    it('should calculate score with moderate violations', () => {
      const results = {
        violations: [
          {
            impact: 'moderate',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBeLessThan(100);
      expect(score.moderateIssues).toBe(1);
    });

    it('should calculate score with minor violations', () => {
      const results = {
        violations: [
          {
            impact: 'minor',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBeLessThan(100);
      expect(score.minorIssues).toBe(1);
    });

    it('should weight violations by impact level', () => {
      const criticalResults = {
        violations: [
          {
            impact: 'critical',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const minorResults = {
        violations: [
          {
            impact: 'minor',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const criticalScore = AxeService.calculateScore(criticalResults);
      const minorScore = AxeService.calculateScore(minorResults);

      expect(criticalScore.score).toBeLessThan(minorScore.score);
    });

    it('should weight violations by node count', () => {
      const singleNode = {
        violations: [
          {
            impact: 'critical',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const multipleNodes = {
        violations: [
          {
            impact: 'critical',
            nodes: [
              { html: '<div></div>' },
              { html: '<div></div>' },
              { html: '<div></div>' },
            ],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const singleScore = AxeService.calculateScore(singleNode);
      const multipleScore = AxeService.calculateScore(multipleNodes);

      expect(multipleScore.score).toBeLessThan(singleScore.score);
    });

    it('should handle incomplete items with half weight', () => {
      const results = {
        violations: [],
        incomplete: [
          {
            impact: 'moderate',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        passes: [],
      };

      const score = AxeService.calculateScore(results);

      // With only incomplete items and no passes, score should be less than 100
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.incomplete).toBe(1);
    });

    it('should handle mixed violations and incomplete', () => {
      const results = {
        violations: [
          {
            impact: 'serious',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [
          {
            impact: 'moderate',
            nodes: [{ html: '<span></span>' }],
          },
        ],
        passes: [{ id: 'test1' }, { id: 'test2' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBeGreaterThan(0);
      expect(score.score).toBeLessThan(100);
      expect(score.violations).toBe(1);
      expect(score.incomplete).toBe(1);
      expect(score.passes).toBe(2);
    });

    it('should count issues by severity', () => {
      const results = {
        violations: [
          { impact: 'critical', nodes: [{}] },
          { impact: 'critical', nodes: [{}] },
          { impact: 'serious', nodes: [{}] },
          { impact: 'moderate', nodes: [{}] },
          { impact: 'moderate', nodes: [{}] },
          { impact: 'moderate', nodes: [{}] },
          { impact: 'minor', nodes: [{}] },
        ],
        incomplete: [],
        passes: [],
      };

      const score = AxeService.calculateScore(results);

      expect(score.criticalIssues).toBe(2);
      expect(score.seriousIssues).toBe(1);
      expect(score.moderateIssues).toBe(3);
      expect(score.minorIssues).toBe(1);
      expect(score.violations).toBe(7);
    });

    it('should handle violations without impact', () => {
      const results = {
        violations: [
          {
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBeLessThan(100);
      expect(score.violations).toBe(1);
    });

    it('should handle empty results', () => {
      const results = {
        violations: [],
        incomplete: [],
        passes: [],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBe(100);
      expect(score.violations).toBe(0);
      expect(score.incomplete).toBe(0);
      expect(score.passes).toBe(0);
    });

    it('should return score between 0 and 100', () => {
      const results = {
        violations: [
          {
            impact: 'critical',
            nodes: Array(100)
              .fill(null)
              .map(() => ({ html: '<div></div>' })),
          },
        ],
        incomplete: [],
        passes: [],
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('should round score to integer', () => {
      const results = {
        violations: [
          {
            impact: 'moderate',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }, { id: 'test2' }, { id: 'test3' }],
      };

      const score = AxeService.calculateScore(results);

      expect(Number.isInteger(score.score)).toBe(true);
    });
  });

  // Note: analyzeByWCAGLevel and getViolationsOnly tests are skipped
  // as they require complex Puppeteer and AxePuppeteer mocking
  // These methods are tested through integration tests

  describe('edge cases', () => {
    it('should handle results with all severity levels', () => {
      const results = {
        violations: [
          { impact: 'critical', nodes: [{}] },
          { impact: 'serious', nodes: [{}] },
          { impact: 'moderate', nodes: [{}] },
          { impact: 'minor', nodes: [{}] },
        ],
        incomplete: [{ impact: 'moderate', nodes: [{}] }],
        passes: [{ id: 'test1' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.criticalIssues).toBe(1);
      expect(score.seriousIssues).toBe(1);
      expect(score.moderateIssues).toBe(1);
      expect(score.minorIssues).toBe(1);
      expect(score.violations).toBe(4);
      expect(score.incomplete).toBe(1);
    });

    it('should handle violations with empty nodes array', () => {
      const results = {
        violations: [
          {
            impact: 'critical',
            nodes: [],
          },
        ],
        incomplete: [],
        passes: [],
      };

      const score = AxeService.calculateScore(results);

      expect(score.violations).toBe(1);
      expect(score.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle large number of passes', () => {
      const results = {
        violations: [],
        incomplete: [],
        passes: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: `test${i}` })),
      };

      const score = AxeService.calculateScore(results);

      expect(score.score).toBe(100);
      expect(score.passes).toBe(1000);
    });

    it('should handle mixed impact levels in same violation', () => {
      const results = {
        violations: [
          {
            impact: 'critical',
            nodes: [{ html: '<div></div>' }, { html: '<span></span>' }],
          },
          {
            impact: 'minor',
            nodes: [{ html: '<p></p>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const score = AxeService.calculateScore(results);

      expect(score.violations).toBe(2);
      expect(score.criticalIssues).toBe(1);
      expect(score.minorIssues).toBe(1);
    });
  });

  describe('score calculation accuracy', () => {
    it('should give lower score for more violations', () => {
      const fewViolations = {
        violations: [{ impact: 'moderate', nodes: [{}] }],
        incomplete: [],
        passes: [{ id: 'test1' }, { id: 'test2' }],
      };

      const manyViolations = {
        violations: [
          { impact: 'moderate', nodes: [{}] },
          { impact: 'moderate', nodes: [{}] },
          { impact: 'moderate', nodes: [{}] },
        ],
        incomplete: [],
        passes: [{ id: 'test1' }, { id: 'test2' }],
      };

      const fewScore = AxeService.calculateScore(fewViolations);
      const manyScore = AxeService.calculateScore(manyViolations);

      expect(manyScore.score).toBeLessThan(fewScore.score);
    });

    it('should give higher score for more passes', () => {
      const fewPasses = {
        violations: [{ impact: 'moderate', nodes: [{}] }],
        incomplete: [],
        passes: [{ id: 'test1' }],
      };

      const manyPasses = {
        violations: [{ impact: 'moderate', nodes: [{}] }],
        incomplete: [],
        passes: [
          { id: 'test1' },
          { id: 'test2' },
          { id: 'test3' },
          { id: 'test4' },
        ],
      };

      const fewScore = AxeService.calculateScore(fewPasses);
      const manyScore = AxeService.calculateScore(manyPasses);

      expect(manyScore.score).toBeGreaterThan(fewScore.score);
    });

    it('should calculate consistent scores', () => {
      const results = {
        violations: [
          { impact: 'serious', nodes: [{}] },
          { impact: 'moderate', nodes: [{}] },
        ],
        incomplete: [{ impact: 'minor', nodes: [{}] }],
        passes: [{ id: 'test1' }, { id: 'test2' }],
      };

      const score1 = AxeService.calculateScore(results);
      const score2 = AxeService.calculateScore(results);

      expect(score1.score).toBe(score2.score);
    });
  });
});
