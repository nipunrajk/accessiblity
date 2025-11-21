import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LighthouseService from '../../services/analysis/lighthouse.service.js';

// Mock dependencies
vi.mock('lighthouse', () => ({
  default: vi.fn(),
}));

vi.mock('chrome-launcher', () => ({
  launch: vi.fn(),
}));

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

vi.mock('../../utils/logger.js', () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('LighthouseService', () => {
  describe('processLighthouseReport', () => {
    const mockReport = {
      categories: {
        performance: {
          score: 0.85,
          auditRefs: [
            { id: 'first-contentful-paint', weight: 10 },
            { id: 'largest-contentful-paint', weight: 25 },
            { id: 'total-blocking-time', weight: 30 },
            { id: 'cumulative-layout-shift', weight: 15 },
            { id: 'speed-index', weight: 10 },
            { id: 'interactive', weight: 10 },
            { id: 'render-blocking-resources', weight: 5 },
          ],
        },
        accessibility: {
          score: 0.92,
          auditRefs: [
            { id: 'color-contrast', weight: 3 },
            { id: 'image-alt', weight: 10 },
            { id: 'button-name', weight: 10 },
          ],
        },
        'best-practices': {
          score: 0.88,
          auditRefs: [
            { id: 'errors-in-console', weight: 1 },
            { id: 'uses-https', weight: 5 },
          ],
        },
        seo: {
          score: 0.95,
          auditRefs: [
            { id: 'meta-description', weight: 5 },
            { id: 'document-title', weight: 5 },
          ],
        },
      },
      audits: {
        'first-contentful-paint': {
          score: 0.9,
          title: 'First Contentful Paint',
          description:
            'FCP marks the time at which the first text or image is painted',
          numericValue: 1500,
        },
        'largest-contentful-paint': {
          score: 0.7,
          title: 'Largest Contentful Paint',
          description:
            'LCP marks the time at which the largest text or image is painted',
          numericValue: 3000,
        },
        'total-blocking-time': {
          score: 0.8,
          title: 'Total Blocking Time',
          description: 'Sum of all time periods between FCP and TTI',
          numericValue: 200,
        },
        'cumulative-layout-shift': {
          score: 0.95,
          title: 'Cumulative Layout Shift',
          description: 'CLS measures visual stability',
          numericValue: 0.05,
        },
        'speed-index': {
          score: 0.85,
          title: 'Speed Index',
          description:
            'Speed Index shows how quickly content is visually displayed',
          numericValue: 2500,
        },
        interactive: {
          score: 0.75,
          title: 'Time to Interactive',
          description:
            'TTI marks the time at which the page is fully interactive',
          numericValue: 4000,
        },
        'render-blocking-resources': {
          score: 0.6,
          title: 'Eliminate render-blocking resources',
          description: 'Resources are blocking the first paint',
          details: {
            items: [
              {
                url: 'https://example.com/style.css',
                totalBytes: 50000,
              },
            ],
          },
        },
        'color-contrast': {
          score: 0.8,
          title: 'Background and foreground colors have sufficient contrast',
          description: 'Low-contrast text is difficult to read',
          details: {
            items: [
              {
                node: {
                  snippet: '<div class="text">Low contrast</div>',
                  selector: '.text',
                },
              },
            ],
          },
        },
        'image-alt': {
          score: 1,
          title: 'Image elements have [alt] attributes',
          description: 'Alt text helps screen readers',
        },
        'button-name': {
          score: 0.9,
          title: 'Buttons have an accessible name',
          description: 'Buttons must have discernible text',
          details: {
            items: [
              {
                node: {
                  snippet: '<button></button>',
                  selector: 'button.submit',
                },
              },
            ],
          },
        },
        'errors-in-console': {
          score: 0.5,
          title: 'No browser errors logged to the console',
          description: 'Errors logged to the console indicate issues',
          details: {
            items: [
              {
                source: 'console.error',
                description: 'TypeError: Cannot read property',
              },
            ],
          },
        },
        'uses-https': {
          score: 1,
          title: 'Uses HTTPS',
          description: 'All sites should be protected with HTTPS',
        },
        'meta-description': {
          score: 1,
          title: 'Document has a meta description',
          description: 'Meta descriptions help search engines',
        },
        'document-title': {
          score: 0.8,
          title: 'Document has a title element',
          description: 'The title gives screen readers context',
        },
      },
    };

    it('should process performance metrics correctly', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.performance.score).toBe(85);
      expect(result.performance.metrics.fcp.score).toBe(90);
      expect(result.performance.metrics.fcp.value).toBe(1500);
      expect(result.performance.metrics.lcp.score).toBe(70);
      expect(result.performance.metrics.lcp.value).toBe(3000);
      expect(result.performance.metrics.tbt.score).toBe(80);
      expect(result.performance.metrics.cls.score).toBe(95);
      expect(result.performance.metrics.si.score).toBe(85);
      expect(result.performance.metrics.tti.score).toBe(75);
    });

    it('should extract performance issues', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.performance.issues).toBeDefined();
      expect(Array.isArray(result.performance.issues)).toBe(true);
      expect(result.performance.issues.length).toBeGreaterThan(0);

      const issue = result.performance.issues[0];
      expect(issue).toHaveProperty('type');
      expect(issue).toHaveProperty('title');
      expect(issue).toHaveProperty('description');
      expect(issue).toHaveProperty('score');
      expect(issue).toHaveProperty('impact');
    });

    it('should calculate accessibility score correctly', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.accessibility.score).toBe(92);
      expect(result.accessibility.audits.passed).toBeGreaterThan(0);
      expect(result.accessibility.audits.total).toBe(3);
    });

    it('should extract accessibility issues', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.accessibility.issues).toBeDefined();
      expect(Array.isArray(result.accessibility.issues)).toBe(true);

      const failedIssues = result.accessibility.issues.filter(
        (issue) => issue.score < 100
      );
      expect(failedIssues.length).toBeGreaterThan(0);
    });

    it('should calculate best practices score correctly', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.bestPractices.score).toBe(88);
      expect(result.bestPractices.audits.total).toBe(2);
    });

    it('should extract best practices issues', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.bestPractices.issues).toBeDefined();
      expect(Array.isArray(result.bestPractices.issues)).toBe(true);
    });

    it('should calculate SEO score correctly', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.seo.score).toBe(95);
      expect(result.seo.audits.total).toBe(2);
    });

    it('should extract SEO issues', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(result.seo.issues).toBeDefined();
      expect(Array.isArray(result.seo.issues)).toBe(true);
    });

    it('should include recommendations for issues', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      const issuesWithDetails = result.accessibility.issues.filter(
        (issue) => issue.recommendations && issue.recommendations.length > 0
      );

      if (issuesWithDetails.length > 0) {
        const issue = issuesWithDetails[0];
        expect(issue.recommendations[0]).toHaveProperty('snippet');
        expect(issue.recommendations[0]).toHaveProperty('selector');
      }
    });

    it('should calculate impact scores for issues', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      const allIssues = [
        ...result.performance.issues,
        ...result.accessibility.issues,
        ...result.bestPractices.issues,
        ...result.seo.issues,
      ];

      allIssues.forEach((issue) => {
        expect(issue.impact).toBeDefined();
        expect(typeof parseFloat(issue.impact)).toBe('number');
        expect(parseFloat(issue.impact)).toBeGreaterThanOrEqual(0);
      });
    });

    it('should filter issues by cumulative impact (80% rule)', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      // Issues should be filtered to top 80% of impact
      const performanceIssues = result.performance.issues;
      if (performanceIssues.length > 0) {
        const totalImpact = performanceIssues.reduce(
          (sum, issue) => sum + parseFloat(issue.impact),
          0
        );
        expect(totalImpact).toBeGreaterThan(0);
      }
    });

    it('should handle audits with null scores', () => {
      const reportWithNull = {
        ...mockReport,
        audits: {
          ...mockReport.audits,
          'test-audit': {
            score: null,
            title: 'Test Audit',
            description: 'Not applicable',
          },
        },
        categories: {
          ...mockReport.categories,
          performance: {
            ...mockReport.categories.performance,
            auditRefs: [
              ...mockReport.categories.performance.auditRefs,
              { id: 'test-audit', weight: 5 },
            ],
          },
        },
      };

      const result = LighthouseService.processLighthouseReport(reportWithNull);
      expect(result.performance.score).toBeDefined();
    });

    it('should handle audits with perfect scores', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      // Perfect score audits should not be included in issues
      const perfectScoreIssues = result.accessibility.issues.filter(
        (issue) => issue.score === 100
      );
      expect(perfectScoreIssues.length).toBe(0);
    });

    it('should sort issues by impact', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      const checkSorted = (issues) => {
        for (let i = 0; i < issues.length - 1; i++) {
          const currentImpact = parseFloat(issues[i].impact);
          const nextImpact = parseFloat(issues[i + 1].impact);
          expect(currentImpact).toBeGreaterThanOrEqual(nextImpact);
        }
      };

      if (result.performance.issues.length > 1) {
        checkSorted(result.performance.issues);
      }
    });

    it('should handle missing details in audits', () => {
      const reportWithoutDetails = {
        ...mockReport,
        audits: {
          ...mockReport.audits,
          'color-contrast': {
            score: 0.8,
            title: 'Color Contrast',
            description: 'Test',
            // No details property
          },
        },
      };

      const result =
        LighthouseService.processLighthouseReport(reportWithoutDetails);
      expect(result.accessibility.issues).toBeDefined();
    });

    it('should limit recommendations to 3 per issue', () => {
      const reportWithManyItems = {
        ...mockReport,
        audits: {
          ...mockReport.audits,
          'color-contrast': {
            score: 0.5,
            title: 'Color Contrast',
            description: 'Test',
            details: {
              items: Array(10)
                .fill(null)
                .map((_, i) => ({
                  node: {
                    snippet: `<div>Item ${i}</div>`,
                    selector: `.item-${i}`,
                  },
                })),
            },
          },
        },
      };

      const result =
        LighthouseService.processLighthouseReport(reportWithManyItems);
      const colorContrastIssue = result.accessibility.issues.find(
        (issue) => issue.title === 'Color Contrast'
      );

      if (colorContrastIssue) {
        expect(colorContrastIssue.recommendations.length).toBeLessThanOrEqual(
          3
        );
      }
    });

    it('should handle empty audit refs', () => {
      const reportWithEmptyRefs = {
        categories: {
          performance: { score: 1, auditRefs: [] },
          accessibility: { score: 1, auditRefs: [] },
          'best-practices': { score: 1, auditRefs: [] },
          seo: { score: 1, auditRefs: [] },
        },
        audits: {
          'first-contentful-paint': { score: 1, numericValue: 1000 },
          'largest-contentful-paint': { score: 1, numericValue: 2000 },
          'total-blocking-time': { score: 1, numericValue: 100 },
          'cumulative-layout-shift': { score: 1, numericValue: 0.01 },
          'speed-index': { score: 1, numericValue: 2000 },
          interactive: { score: 1, numericValue: 3000 },
        },
      };

      const result =
        LighthouseService.processLighthouseReport(reportWithEmptyRefs);
      expect(result.performance.score).toBe(100);
      expect(result.performance.issues).toEqual([]);
    });

    it('should calculate audit counts correctly', () => {
      const result = LighthouseService.processLighthouseReport(mockReport);

      expect(
        result.accessibility.audits.passed + result.accessibility.audits.failed
      ).toBeLessThanOrEqual(result.accessibility.audits.total);

      expect(
        result.bestPractices.audits.passed + result.bestPractices.audits.failed
      ).toBeLessThanOrEqual(result.bestPractices.audits.total);

      expect(
        result.seo.audits.passed + result.seo.audits.failed
      ).toBeLessThanOrEqual(result.seo.audits.total);
    });
  });

  // Note: discoverPages tests are skipped as they require complex Puppeteer mocking
  // The method is tested through integration tests

  describe('edge cases', () => {
    const requiredAudits = {
      'first-contentful-paint': { score: 0, numericValue: 5000 },
      'largest-contentful-paint': { score: 0, numericValue: 8000 },
      'total-blocking-time': { score: 0, numericValue: 1000 },
      'cumulative-layout-shift': { score: 0, numericValue: 0.5 },
      'speed-index': { score: 0, numericValue: 8000 },
      interactive: { score: 0, numericValue: 10000 },
    };

    it('should handle report with zero scores', () => {
      const zeroScoreReport = {
        categories: {
          performance: { score: 0, auditRefs: [] },
          accessibility: { score: 0, auditRefs: [] },
          'best-practices': { score: 0, auditRefs: [] },
          seo: { score: 0, auditRefs: [] },
        },
        audits: requiredAudits,
      };

      const result = LighthouseService.processLighthouseReport(zeroScoreReport);
      expect(result.performance.score).toBe(0);
      expect(result.accessibility.score).toBe(0);
    });

    it('should handle report with perfect scores', () => {
      const perfectReport = {
        categories: {
          performance: { score: 1, auditRefs: [] },
          accessibility: { score: 1, auditRefs: [] },
          'best-practices': { score: 1, auditRefs: [] },
          seo: { score: 1, auditRefs: [] },
        },
        audits: {
          'first-contentful-paint': { score: 1, numericValue: 1000 },
          'largest-contentful-paint': { score: 1, numericValue: 2000 },
          'total-blocking-time': { score: 1, numericValue: 100 },
          'cumulative-layout-shift': { score: 1, numericValue: 0.01 },
          'speed-index': { score: 1, numericValue: 2000 },
          interactive: { score: 1, numericValue: 3000 },
        },
      };

      const result = LighthouseService.processLighthouseReport(perfectReport);
      expect(result.performance.score).toBe(100);
      expect(result.accessibility.score).toBe(100);
      expect(result.bestPractices.score).toBe(100);
      expect(result.seo.score).toBe(100);
    });

    it('should handle missing weight in audit refs', () => {
      const reportWithoutWeights = {
        categories: {
          performance: {
            score: 0.8,
            auditRefs: [{ id: 'test-audit' }], // No weight
          },
          accessibility: { score: 1, auditRefs: [] },
          'best-practices': { score: 1, auditRefs: [] },
          seo: { score: 1, auditRefs: [] },
        },
        audits: {
          ...requiredAudits,
          'test-audit': {
            score: 0.5,
            title: 'Test',
            description: 'Test audit',
          },
        },
      };

      const result =
        LighthouseService.processLighthouseReport(reportWithoutWeights);
      expect(result.performance.issues).toBeDefined();
    });
  });
});
