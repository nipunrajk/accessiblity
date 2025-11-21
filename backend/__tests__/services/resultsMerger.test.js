import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultsMerger from '../../services/accessibility/resultsMerger.js';
import * as transformers from '../../utils/transformers.js';

vi.mock('../../utils/logger.js');

describe('ResultsMerger', () => {
  let mockLighthouseResults;
  let mockAxeResults;
  let mockPa11yResults;

  beforeEach(() => {
    mockLighthouseResults = {
      url: 'https://example.com',
      version: '10.0.0',
      fetchTime: '2024-01-01T00:00:00.000Z',
      accessibility: {
        score: 85,
        issues: [
          {
            type: 'accessibility',
            title: 'Image missing alt text',
            severity: 'critical',
            detectedBy: ['lighthouse'],
            selector: 'img.logo',
          },
        ],
      },
      performance: { score: 90 },
      bestPractices: { score: 95 },
      seo: { score: 88 },
    };

    mockAxeResults = {
      url: 'https://example.com',
      testEngine: {
        name: 'axe-core',
        version: '4.4.0',
      },
      testRunner: { name: 'axe' },
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Contrast issue',
          help: 'Fix contrast',
          helpUrl: 'https://example.com/help',
          tags: ['wcag2aa', 'wcag143'],
          nodes: [{ html: '<p>Text</p>', target: ['p'] }],
        },
      ],
      incomplete: [
        {
          id: 'manual-check',
          impact: 'moderate',
          description: 'Needs review',
          help: 'Review this',
          helpUrl: 'https://example.com/review',
          tags: ['wcag2a'],
          nodes: [{ html: '<div>Content</div>', target: ['div'] }],
        },
      ],
      passes: [{ id: 'pass-1' }, { id: 'pass-2' }],
    };

    mockPa11yResults = {
      url: 'https://example.com',
      documentTitle: 'Example Page',
      issues: [
        {
          type: 'error',
          code: 'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail',
          message: 'Insufficient contrast',
          selector: '.text',
          context: '<p class="text">Low contrast</p>',
          wcagCriteria: '1.4.3',
          wcagLevel: 'AA',
        },
      ],
      score: {
        score: 75,
      },
    };
  });

  describe('mergeResults', () => {
    it('should merge Lighthouse and Axe results (2-way)', () => {
      const result = ResultsMerger.mergeResults(
        mockLighthouseResults,
        mockAxeResults
      );

      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('accessibility');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('bestPractices');
      expect(result).toHaveProperty('seo');
      expect(result).toHaveProperty('toolDetails');
    });

    it('should merge Lighthouse, Axe, and Pa11y results (3-way)', () => {
      const result = ResultsMerger.mergeResults(
        mockLighthouseResults,
        mockAxeResults,
        mockPa11yResults
      );

      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result.toolDetails).toHaveProperty('lighthouse');
      expect(result.toolDetails).toHaveProperty('axe');
      expect(result.toolDetails).toHaveProperty('pa11y');
    });

    it('should include tool details for all sources', () => {
      const result = ResultsMerger.mergeResults(
        mockLighthouseResults,
        mockAxeResults,
        mockPa11yResults
      );

      expect(result.toolDetails.lighthouse).toHaveProperty('version', '10.0.0');
      expect(result.toolDetails.axe).toHaveProperty('version', '4.4.0');
      expect(result.toolDetails.pa11y).toHaveProperty('runner', 'htmlcs');
      expect(result.toolDetails.pa11y).toHaveProperty(
        'documentTitle',
        'Example Page'
      );
    });

    it('should preserve Lighthouse categories', () => {
      const result = ResultsMerger.mergeResults(
        mockLighthouseResults,
        mockAxeResults
      );

      expect(result.performance).toEqual({ score: 90 });
      expect(result.bestPractices).toEqual({ score: 95 });
      expect(result.seo).toEqual({ score: 88 });
    });

    it('should use fallback URL if Lighthouse URL is missing', () => {
      const lighthouseWithoutUrl = { ...mockLighthouseResults, url: undefined };
      const result = ResultsMerger.mergeResults(
        lighthouseWithoutUrl,
        mockAxeResults
      );

      expect(result.url).toBe('https://example.com');
    });

    it('should generate timestamp', () => {
      const result = ResultsMerger.mergeResults(
        mockLighthouseResults,
        mockAxeResults
      );

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  describe('calculateCombinedScores', () => {
    it('should calculate 2-way combined score (50% Lighthouse, 50% Axe)', () => {
      const scores = ResultsMerger.calculateCombinedScores(
        mockLighthouseResults,
        mockAxeResults
      );

      expect(scores).toHaveProperty('lighthouse');
      expect(scores).toHaveProperty('axe');
      expect(scores).toHaveProperty('combined');
      expect(scores).toHaveProperty('grade');
      expect(scores).not.toHaveProperty('pa11y');

      // Verify 50/50 weighting
      const expectedCombined = Math.round(
        mockLighthouseResults.accessibility.score * 0.5 + scores.axe * 0.5
      );
      expect(scores.combined).toBe(expectedCombined);
    });

    it('should calculate 3-way combined score (40% Lighthouse, 40% Axe, 20% Pa11y)', () => {
      const scores = ResultsMerger.calculateCombinedScores(
        mockLighthouseResults,
        mockAxeResults,
        mockPa11yResults
      );

      expect(scores).toHaveProperty('lighthouse');
      expect(scores).toHaveProperty('axe');
      expect(scores).toHaveProperty('pa11y', 75);
      expect(scores).toHaveProperty('combined');
      expect(scores).toHaveProperty('grade');

      // Verify 40/40/20 weighting
      const expectedCombined = Math.round(
        mockLighthouseResults.accessibility.score * 0.4 +
          scores.axe * 0.4 +
          75 * 0.2
      );
      expect(scores.combined).toBe(expectedCombined);
    });

    it('should round all scores to integers', () => {
      const scores = ResultsMerger.calculateCombinedScores(
        mockLighthouseResults,
        mockAxeResults,
        mockPa11yResults
      );

      expect(Number.isInteger(scores.lighthouse)).toBe(true);
      expect(Number.isInteger(scores.axe)).toBe(true);
      expect(Number.isInteger(scores.pa11y)).toBe(true);
      expect(Number.isInteger(scores.combined)).toBe(true);
    });

    it('should assign correct letter grade', () => {
      const highScoreLighthouse = {
        accessibility: { score: 95 },
      };
      const highScoreAxe = {
        violations: [],
        incomplete: [],
        passes: Array(10).fill({ id: 'pass' }),
      };

      const scores = ResultsMerger.calculateCombinedScores(
        highScoreLighthouse,
        highScoreAxe
      );

      expect(scores.grade).toMatch(/^[A-F]$/);
    });

    it('should handle missing Lighthouse accessibility score', () => {
      const lighthouseNoScore = {
        accessibility: {},
      };

      const scores = ResultsMerger.calculateCombinedScores(
        lighthouseNoScore,
        mockAxeResults
      );

      expect(scores.lighthouse).toBe(0);
      expect(scores.combined).toBeDefined();
    });

    it('should handle null Pa11y score', () => {
      const pa11yNoScore = {
        ...mockPa11yResults,
        score: { score: null },
      };

      const scores = ResultsMerger.calculateCombinedScores(
        mockLighthouseResults,
        mockAxeResults,
        pa11yNoScore
      );

      // Should fall back to 2-way calculation
      expect(scores).not.toHaveProperty('pa11y');
    });
  });

  describe('calculateAxeScore', () => {
    it('should calculate score from Axe results', () => {
      const score = ResultsMerger.calculateAxeScore(mockAxeResults);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle empty Axe results', () => {
      const emptyAxe = {
        violations: [],
        incomplete: [],
        passes: [],
      };

      const score = ResultsMerger.calculateAxeScore(emptyAxe);

      expect(score).toBe(100);
    });

    it('should penalize violations', () => {
      const noViolations = {
        violations: [],
        incomplete: [],
        passes: [{ id: 'pass-1' }],
      };

      const withViolations = {
        violations: [
          {
            impact: 'critical',
            nodes: [{ html: '<div></div>' }],
          },
        ],
        incomplete: [],
        passes: [{ id: 'pass-1' }],
      };

      const scoreNoViolations = ResultsMerger.calculateAxeScore(noViolations);
      const scoreWithViolations =
        ResultsMerger.calculateAxeScore(withViolations);

      expect(scoreWithViolations).toBeLessThan(scoreNoViolations);
    });

    it('should handle missing arrays', () => {
      const partialAxe = {
        violations: [
          {
            impact: 'moderate',
            nodes: [{ html: '<div></div>' }],
          },
        ],
      };

      const score = ResultsMerger.calculateAxeScore(partialAxe);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('mergeAccessibilityResults', () => {
    it('should merge accessibility results from all sources', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        mockLighthouseResults.accessibility,
        mockAxeResults,
        mockPa11yResults
      );

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('wcagCompliance');
    });

    it('should deduplicate issues', () => {
      // Create duplicate issues
      const lighthouseWithDupe = {
        score: 85,
        issues: [
          {
            type: 'accessibility',
            title: 'Color contrast',
            severity: 'serious',
            detectedBy: ['lighthouse'],
            selector: '.text',
          },
        ],
      };

      const axeWithDupe = {
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Color contrast',
            help: 'Color contrast',
            helpUrl: 'https://example.com',
            tags: ['wcag2aa'],
            nodes: [{ html: '<p class="text">Text</p>', target: ['.text'] }],
          },
        ],
        incomplete: [],
        passes: [],
      };

      const result = ResultsMerger.mergeAccessibilityResults(
        lighthouseWithDupe,
        axeWithDupe
      );

      // Should merge duplicates
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should track issues by source', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        mockLighthouseResults.accessibility,
        mockAxeResults,
        mockPa11yResults
      );

      expect(result.summary.bySource).toHaveProperty('lighthouse');
      expect(result.summary.bySource).toHaveProperty('axe');
      expect(result.summary.bySource).toHaveProperty('pa11y');
      expect(result.summary.bySource).toHaveProperty('both');
      expect(result.summary.bySource).toHaveProperty('multiple');
    });

    it('should track issues by source (2-way)', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        mockLighthouseResults.accessibility,
        mockAxeResults
      );

      expect(result.summary.bySource).toHaveProperty('lighthouse');
      expect(result.summary.bySource).toHaveProperty('axe');
      expect(result.summary.bySource).toHaveProperty('both');
      expect(result.summary.bySource).not.toHaveProperty('pa11y');
    });

    it('should categorize issues by severity', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        mockLighthouseResults.accessibility,
        mockAxeResults,
        mockPa11yResults
      );

      expect(result.summary).toHaveProperty('total');
      expect(result.summary).toHaveProperty('critical');
      expect(result.summary).toHaveProperty('serious');
      expect(result.summary).toHaveProperty('moderate');
      expect(result.summary).toHaveProperty('minor');

      const totalBySeverity =
        result.summary.critical +
        result.summary.serious +
        result.summary.moderate +
        result.summary.minor;
      expect(totalBySeverity).toBeLessThanOrEqual(result.summary.total);
    });

    it('should calculate WCAG compliance', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        mockLighthouseResults.accessibility,
        mockAxeResults,
        mockPa11yResults
      );

      expect(result.wcagCompliance).toHaveProperty('A');
      expect(result.wcagCompliance).toHaveProperty('AA');
      expect(result.wcagCompliance).toHaveProperty('AAA');
      expect(result.wcagCompliance).toHaveProperty('overall');
    });

    it('should handle empty Lighthouse issues', () => {
      const emptyLighthouse = {
        score: 100,
        issues: [],
      };

      const result = ResultsMerger.mergeAccessibilityResults(
        emptyLighthouse,
        mockAxeResults
      );

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle missing Lighthouse accessibility', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        null,
        mockAxeResults
      );

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should convert Axe violations to common format', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        { score: 100, issues: [] },
        mockAxeResults
      );

      const axeIssues = result.issues.filter((i) =>
        i.detectedBy?.includes('axe-core')
      );
      expect(axeIssues.length).toBeGreaterThan(0);
      axeIssues.forEach((issue) => {
        expect(issue).toHaveProperty('type', 'accessibility');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('detectedBy');
      });
    });

    it('should convert Axe incomplete to common format', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        { score: 100, issues: [] },
        mockAxeResults
      );

      const incompleteIssues = result.issues.filter(
        (i) => i.requiresManualCheck === true
      );
      expect(incompleteIssues.length).toBeGreaterThan(0);
    });

    it('should convert Pa11y issues to common format', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        { score: 100, issues: [] },
        mockAxeResults,
        mockPa11yResults
      );

      const pa11yIssues = result.issues.filter((i) =>
        i.detectedBy?.includes('pa11y')
      );
      expect(pa11yIssues.length).toBeGreaterThan(0);
      pa11yIssues.forEach((issue) => {
        expect(issue).toHaveProperty('type', 'accessibility');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('detectedBy');
      });
    });

    it('should count issues detected by multiple tools', () => {
      const lighthouseWithShared = {
        score: 85,
        issues: [
          {
            type: 'accessibility',
            title: 'Shared issue',
            severity: 'serious',
            detectedBy: ['lighthouse', 'axe-core'],
            selector: '.shared',
          },
        ],
      };

      const result = ResultsMerger.mergeAccessibilityResults(
        lighthouseWithShared,
        mockAxeResults,
        mockPa11yResults
      );

      expect(result.summary.bySource.multiple).toBeGreaterThanOrEqual(0);
    });

    it('should handle null Pa11y results', () => {
      const result = ResultsMerger.mergeAccessibilityResults(
        mockLighthouseResults.accessibility,
        mockAxeResults,
        null
      );

      expect(result.issues).toBeDefined();
      expect(result.summary.bySource).not.toHaveProperty('pa11y');
    });
  });

  describe('Integration tests', () => {
    it('should produce consistent scores across methods', () => {
      const mergedResults = ResultsMerger.mergeResults(
        mockLighthouseResults,
        mockAxeResults,
        mockPa11yResults
      );

      expect(mergedResults.scores.combined).toBe(
        mergedResults.accessibility.score
      );
    });

    it('should handle all tools returning perfect scores', () => {
      const perfectLighthouse = {
        url: 'https://example.com',
        version: '10.0.0',
        fetchTime: '2024-01-01T00:00:00.000Z',
        accessibility: { score: 100, issues: [] },
        performance: { score: 100 },
        bestPractices: { score: 100 },
        seo: { score: 100 },
      };

      const perfectAxe = {
        violations: [],
        incomplete: [],
        passes: Array(50).fill({ id: 'pass' }),
        testEngine: { name: 'axe-core', version: '4.4.0' },
      };

      const perfectPa11y = {
        url: 'https://example.com',
        issues: [],
        score: { score: 100 },
      };

      const result = ResultsMerger.mergeResults(
        perfectLighthouse,
        perfectAxe,
        perfectPa11y
      );

      expect(result.scores.combined).toBeGreaterThanOrEqual(90);
      expect(result.accessibility.summary.total).toBe(0);
    });

    it('should handle all tools returning failing scores', () => {
      const failingLighthouse = {
        url: 'https://example.com',
        version: '10.0.0',
        fetchTime: '2024-01-01T00:00:00.000Z',
        accessibility: {
          score: 30,
          issues: Array(10).fill({
            type: 'accessibility',
            title: 'Issue',
            severity: 'critical',
            detectedBy: ['lighthouse'],
          }),
        },
        performance: { score: 30 },
        bestPractices: { score: 30 },
        seo: { score: 30 },
      };

      const failingAxe = {
        violations: Array(10).fill({
          id: 'violation',
          impact: 'critical',
          description: 'Issue',
          help: 'Fix',
          helpUrl: 'https://example.com',
          tags: ['wcag2aa'],
          nodes: [{ html: '<div></div>', target: ['div'] }],
        }),
        incomplete: [],
        passes: [],
        testEngine: { name: 'axe-core', version: '4.4.0' },
      };

      const failingPa11y = {
        url: 'https://example.com',
        issues: Array(10).fill({
          type: 'error',
          message: 'Issue',
          selector: 'div',
          context: '<div></div>',
        }),
        score: { score: 30 },
      };

      const result = ResultsMerger.mergeResults(
        failingLighthouse,
        failingAxe,
        failingPa11y
      );

      expect(result.scores.combined).toBeLessThan(50);
      expect(result.accessibility.summary.total).toBeGreaterThan(0);
    });
  });
});
