import { describe, it, expect, vi } from 'vitest';
import Pa11yService from '../../services/accessibility/pa11yService.js';

// Mock dependencies
vi.mock('pa11y', () => ({
  default: vi.fn(),
}));

vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Pa11yService', () => {
  describe('extractWCAGLevel', () => {
    it('should extract Level AAA', () => {
      const code = 'WCAG2AAA.Principle1.Guideline1_4.1_4_6.G17';
      expect(Pa11yService.extractWCAGLevel(code)).toBe('AAA');
    });

    it('should extract Level AA', () => {
      const code = 'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18';
      expect(Pa11yService.extractWCAGLevel(code)).toBe('AA');
    });

    it('should extract Level A', () => {
      const code = 'WCAG2A.Principle1.Guideline1_1.1_1_1.H37';
      expect(Pa11yService.extractWCAGLevel(code)).toBe('A');
    });

    it('should return Unknown for codes without level', () => {
      const code = 'SomeOtherCode.Test';
      expect(Pa11yService.extractWCAGLevel(code)).toBe('Unknown');
    });

    it('should prioritize AAA over AA', () => {
      const code = 'WCAG2AAA.Test';
      expect(Pa11yService.extractWCAGLevel(code)).toBe('AAA');
    });

    it('should prioritize AA over A', () => {
      const code = 'WCAG2AA.Test';
      expect(Pa11yService.extractWCAGLevel(code)).toBe('AA');
    });
  });

  describe('extractWCAGCriteria', () => {
    it('should extract criteria pattern from code', () => {
      const code = 'WCAG2AA.1.4.3.Something';
      expect(Pa11yService.extractWCAGCriteria(code)).toBe('1.4.3');
    });

    it('should return null for codes without criteria', () => {
      const code = 'SomeOtherCode.Test';
      expect(Pa11yService.extractWCAGCriteria(code)).toBeNull();
    });

    it('should extract first matching pattern', () => {
      const code = 'Test.2.4.7.Other';
      expect(Pa11yService.extractWCAGCriteria(code)).toBe('2.4.7');
    });
  });

  describe('extractPrinciple', () => {
    it('should extract Principle1 as perceivable', () => {
      const code = 'WCAG2AA.Principle1.Guideline1.4.1.4.3.G18';
      expect(Pa11yService.extractPrinciple(code)).toBe('perceivable');
    });

    it('should extract Principle2 as operable', () => {
      const code = 'WCAG2AA.Principle2.Guideline2.4.2.4.7.H4';
      expect(Pa11yService.extractPrinciple(code)).toBe('operable');
    });

    it('should extract Principle3 as understandable', () => {
      const code = 'WCAG2AA.Principle3.Guideline3.1.3.1.1.H57';
      expect(Pa11yService.extractPrinciple(code)).toBe('understandable');
    });

    it('should extract Principle4 as robust', () => {
      const code = 'WCAG2AA.Principle4.Guideline4.1.4.1.2.H91';
      expect(Pa11yService.extractPrinciple(code)).toBe('robust');
    });

    it('should fallback to criteria-based extraction', () => {
      const code = 'WCAG2AA.Guideline1.4.1.4.3.G18';
      expect(Pa11yService.extractPrinciple(code)).toBe('perceivable');
    });

    it('should extract from criteria starting with 2', () => {
      const code = 'WCAG2AA.Guideline2.4.2.4.7.H4';
      expect(Pa11yService.extractPrinciple(code)).toBe('operable');
    });

    it('should extract from criteria starting with 3', () => {
      const code = 'WCAG2AA.Guideline3.1.3.1.1.H57';
      expect(Pa11yService.extractPrinciple(code)).toBe('understandable');
    });

    it('should extract from criteria starting with 4', () => {
      const code = 'WCAG2AA.Guideline4.1.4.1.2.H91';
      expect(Pa11yService.extractPrinciple(code)).toBe('robust');
    });

    it('should return unknown for invalid codes', () => {
      const code = 'InvalidCode';
      expect(Pa11yService.extractPrinciple(code)).toBe('unknown');
    });
  });

  describe('formatIssue', () => {
    it('should format issue correctly', () => {
      const issue = {
        code: 'WCAG2AA.Principle1.Test.1.4.3',
        type: 'error',
        typeCode: 1,
        message: 'Color contrast issue',
        context: '<div>Test</div>',
        selector: '#main > div',
        runner: 'htmlcs',
      };

      const formatted = Pa11yService.formatIssue(issue);

      expect(formatted.code).toBe(issue.code);
      expect(formatted.type).toBe('error');
      expect(formatted.typeCode).toBe(1);
      expect(formatted.message).toBe('Color contrast issue');
      expect(formatted.context).toBe('<div>Test</div>');
      expect(formatted.selector).toBe('#main > div');
      expect(formatted.runner).toBe('htmlcs');
      expect(formatted.wcagLevel).toBe('AA');
      expect(formatted.wcagCriteria).toBe('1.4.3');
      expect(formatted.principle).toBe('perceivable');
      expect(formatted.detectedBy).toEqual(['pa11y']);
    });

    it('should handle issue without context', () => {
      const issue = {
        code: 'WCAG2A.Principle1.1.1.1',
        type: 'warning',
        typeCode: 2,
        message: 'Missing alt text',
        selector: 'img',
        runner: 'htmlcs',
      };

      const formatted = Pa11yService.formatIssue(issue);

      expect(formatted.context).toBeUndefined();
      expect(formatted.wcagLevel).toBe('A');
      expect(formatted.wcagCriteria).toBe('1.1.1');
    });
  });

  describe('groupByWCAGLevel', () => {
    it('should group issues by WCAG level', () => {
      const issues = [
        { wcagLevel: 'A', message: 'Issue 1' },
        { wcagLevel: 'AA', message: 'Issue 2' },
        { wcagLevel: 'AA', message: 'Issue 3' },
        { wcagLevel: 'AAA', message: 'Issue 4' },
        { wcagLevel: 'A', message: 'Issue 5' },
      ];

      const grouped = Pa11yService.groupByWCAGLevel(issues);

      expect(grouped.A).toHaveLength(2);
      expect(grouped.AA).toHaveLength(2);
      expect(grouped.AAA).toHaveLength(1);
    });

    it('should handle empty issues array', () => {
      const grouped = Pa11yService.groupByWCAGLevel([]);

      expect(grouped.A).toHaveLength(0);
      expect(grouped.AA).toHaveLength(0);
      expect(grouped.AAA).toHaveLength(0);
    });

    it('should handle issues with only one level', () => {
      const issues = [
        { wcagLevel: 'AA', message: 'Issue 1' },
        { wcagLevel: 'AA', message: 'Issue 2' },
      ];

      const grouped = Pa11yService.groupByWCAGLevel(issues);

      expect(grouped.A).toHaveLength(0);
      expect(grouped.AA).toHaveLength(2);
      expect(grouped.AAA).toHaveLength(0);
    });
  });

  describe('groupByPrinciple', () => {
    it('should group issues by principle', () => {
      const issues = [
        { principle: 'perceivable', message: 'Issue 1' },
        { principle: 'operable', message: 'Issue 2' },
        { principle: 'perceivable', message: 'Issue 3' },
        { principle: 'understandable', message: 'Issue 4' },
        { principle: 'robust', message: 'Issue 5' },
      ];

      const grouped = Pa11yService.groupByPrinciple(issues);

      expect(grouped.perceivable).toHaveLength(2);
      expect(grouped.operable).toHaveLength(1);
      expect(grouped.understandable).toHaveLength(1);
      expect(grouped.robust).toHaveLength(1);
    });

    it('should handle empty issues array', () => {
      const grouped = Pa11yService.groupByPrinciple([]);

      expect(grouped.perceivable).toHaveLength(0);
      expect(grouped.operable).toHaveLength(0);
      expect(grouped.understandable).toHaveLength(0);
      expect(grouped.robust).toHaveLength(0);
    });

    it('should handle issues with only one principle', () => {
      const issues = [
        { principle: 'perceivable', message: 'Issue 1' },
        { principle: 'perceivable', message: 'Issue 2' },
      ];

      const grouped = Pa11yService.groupByPrinciple(issues);

      expect(grouped.perceivable).toHaveLength(2);
      expect(grouped.operable).toHaveLength(0);
    });
  });

  describe('calculateScore', () => {
    it('should return 100 for no issues', () => {
      const score = Pa11yService.calculateScore([], [], []);

      expect(score.score).toBe(100);
      expect(score.errors).toBe(0);
      expect(score.warnings).toBe(0);
      expect(score.notices).toBe(0);
      expect(score.grade).toBe('A');
    });

    it('should calculate score with errors only', () => {
      const errors = [{ type: 'error' }, { type: 'error' }];
      const score = Pa11yService.calculateScore(errors, [], []);

      expect(score.score).toBeLessThan(100);
      expect(score.errors).toBe(2);
      expect(score.warnings).toBe(0);
      expect(score.notices).toBe(0);
    });

    it('should calculate score with warnings only', () => {
      const warnings = [{ type: 'warning' }, { type: 'warning' }];
      const score = Pa11yService.calculateScore([], warnings, []);

      expect(score.score).toBeLessThan(100);
      expect(score.warnings).toBe(2);
    });

    it('should calculate score with notices only', () => {
      const notices = [{ type: 'notice' }, { type: 'notice' }];
      const score = Pa11yService.calculateScore([], [], notices);

      expect(score.score).toBeLessThan(100);
      expect(score.notices).toBe(2);
    });

    it('should weight errors more than warnings', () => {
      const oneError = Pa11yService.calculateScore([{}], [], []);
      const oneWarning = Pa11yService.calculateScore([], [{}], []);

      expect(oneError.score).toBeLessThan(oneWarning.score);
    });

    it('should weight warnings more than notices', () => {
      const oneWarning = Pa11yService.calculateScore([], [{}], []);
      const oneNotice = Pa11yService.calculateScore([], [], [{}]);

      expect(oneWarning.score).toBeLessThan(oneNotice.score);
    });

    it('should calculate score with mixed issues', () => {
      const errors = [{ type: 'error' }];
      const warnings = [{ type: 'warning' }, { type: 'warning' }];
      const notices = [{ type: 'notice' }];

      const score = Pa11yService.calculateScore(errors, warnings, notices);

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.errors).toBe(1);
      expect(score.warnings).toBe(2);
      expect(score.notices).toBe(1);
    });

    it('should not go below 0', () => {
      const manyErrors = Array(100)
        .fill(null)
        .map(() => ({ type: 'error' }));
      const score = Pa11yService.calculateScore(manyErrors, [], []);

      expect(score.score).toBeGreaterThanOrEqual(0);
    });

    it('should assign correct grade A', () => {
      const score = Pa11yService.calculateScore([], [], []);
      expect(score.grade).toBe('A');
    });

    it('should assign correct grade B', () => {
      const errors = [{ type: 'error' }];
      const warnings = [{ type: 'warning' }];
      const score = Pa11yService.calculateScore(errors, warnings, []);

      if (score.score >= 80 && score.score < 90) {
        expect(score.grade).toBe('B');
      }
    });

    it('should assign correct grade F for many errors', () => {
      const manyErrors = Array(20)
        .fill(null)
        .map(() => ({ type: 'error' }));
      const score = Pa11yService.calculateScore(manyErrors, [], []);

      expect(score.grade).toBe('F');
    });
  });

  describe('getGrade', () => {
    it('should return A for score 90-100', () => {
      expect(Pa11yService.getGrade(100)).toBe('A');
      expect(Pa11yService.getGrade(95)).toBe('A');
      expect(Pa11yService.getGrade(90)).toBe('A');
    });

    it('should return B for score 80-89', () => {
      expect(Pa11yService.getGrade(89)).toBe('B');
      expect(Pa11yService.getGrade(85)).toBe('B');
      expect(Pa11yService.getGrade(80)).toBe('B');
    });

    it('should return C for score 70-79', () => {
      expect(Pa11yService.getGrade(79)).toBe('C');
      expect(Pa11yService.getGrade(75)).toBe('C');
      expect(Pa11yService.getGrade(70)).toBe('C');
    });

    it('should return D for score 60-69', () => {
      expect(Pa11yService.getGrade(69)).toBe('D');
      expect(Pa11yService.getGrade(65)).toBe('D');
      expect(Pa11yService.getGrade(60)).toBe('D');
    });

    it('should return F for score below 60', () => {
      expect(Pa11yService.getGrade(59)).toBe('F');
      expect(Pa11yService.getGrade(30)).toBe('F');
      expect(Pa11yService.getGrade(0)).toBe('F');
    });
  });

  describe('formatResults', () => {
    it('should format results correctly', () => {
      const mockResults = {
        pageUrl: 'https://example.com',
        documentTitle: 'Test Page',
        issues: [
          {
            code: 'WCAG2AA.Principle1.Guideline1.4.1.4.3.G18',
            type: 'error',
            typeCode: 1,
            message: 'Error message',
            context: '<div>Test</div>',
            selector: '#main',
            runner: 'htmlcs',
          },
          {
            code: 'WCAG2A.Principle2.Guideline2.4.2.4.7.H4',
            type: 'warning',
            typeCode: 2,
            message: 'Warning message',
            selector: 'a',
            runner: 'htmlcs',
          },
        ],
      };

      const formatted = Pa11yService.formatResults(mockResults);

      expect(formatted.url).toBe('https://example.com');
      expect(formatted.documentTitle).toBe('Test Page');
      expect(formatted.timestamp).toBeDefined();
      expect(formatted.summary.total).toBe(2);
      expect(formatted.summary.errors).toBe(1);
      expect(formatted.summary.warnings).toBe(1);
      expect(formatted.summary.notices).toBe(0);
      expect(formatted.issues).toHaveLength(2);
      expect(formatted.errors).toHaveLength(1);
      expect(formatted.warnings).toHaveLength(1);
      expect(formatted.notices).toHaveLength(0);
      expect(formatted.byWCAGLevel).toBeDefined();
      expect(formatted.byPrinciple).toBeDefined();
      expect(formatted.score).toBeDefined();
    });

    it('should handle results with no issues', () => {
      const mockResults = {
        pageUrl: 'https://example.com',
        documentTitle: 'Perfect Page',
        issues: [],
      };

      const formatted = Pa11yService.formatResults(mockResults);

      expect(formatted.summary.total).toBe(0);
      expect(formatted.issues).toHaveLength(0);
      expect(formatted.score.score).toBe(100);
      expect(formatted.score.grade).toBe('A');
    });

    it('should group issues by WCAG level', () => {
      const mockResults = {
        pageUrl: 'https://example.com',
        documentTitle: 'Test Page',
        issues: [
          {
            code: 'WCAG2A.Principle1.Guideline1.1.1.1.1.H37',
            type: 'error',
            typeCode: 1,
            message: 'Level A issue',
            selector: 'img',
            runner: 'htmlcs',
          },
          {
            code: 'WCAG2AA.Principle1.Guideline1.4.1.4.3.G18',
            type: 'error',
            typeCode: 1,
            message: 'Level AA issue',
            selector: '#main',
            runner: 'htmlcs',
          },
        ],
      };

      const formatted = Pa11yService.formatResults(mockResults);

      expect(formatted.byWCAGLevel.A).toHaveLength(1);
      expect(formatted.byWCAGLevel.AA).toHaveLength(1);
      expect(formatted.byWCAGLevel.AAA).toHaveLength(0);
    });

    it('should group issues by principle', () => {
      const mockResults = {
        pageUrl: 'https://example.com',
        documentTitle: 'Test Page',
        issues: [
          {
            code: 'WCAG2AA.Principle1.Guideline1.4.1.4.3.G18',
            type: 'error',
            typeCode: 1,
            message: 'Perceivable issue',
            selector: '#main',
            runner: 'htmlcs',
          },
          {
            code: 'WCAG2AA.Principle2.Guideline2.4.2.4.7.H4',
            type: 'error',
            typeCode: 1,
            message: 'Operable issue',
            selector: 'a',
            runner: 'htmlcs',
          },
        ],
      };

      const formatted = Pa11yService.formatResults(mockResults);

      expect(formatted.byPrinciple.perceivable).toHaveLength(1);
      expect(formatted.byPrinciple.operable).toHaveLength(1);
      expect(formatted.byPrinciple.understandable).toHaveLength(0);
      expect(formatted.byPrinciple.robust).toHaveLength(0);
    });
  });

  describe('getAvailableStandards', () => {
    it('should return list of available standards', () => {
      const standards = Pa11yService.getAvailableStandards();

      expect(standards).toContain('WCAG2A');
      expect(standards).toContain('WCAG2AA');
      expect(standards).toContain('WCAG2AAA');
      expect(standards).toContain('Section508');
      expect(standards).toHaveLength(4);
    });
  });

  describe('edge cases', () => {
    it('should handle code with double digit criteria', () => {
      const code = 'WCAG2AA.Principle1.Guideline1.4.11.1.4.11.G18';
      expect(Pa11yService.extractWCAGCriteria(code)).toBe('1.4.11');
    });

    it('should handle code without guideline', () => {
      const code = 'WCAG2AA.1.4.3.G18';
      expect(Pa11yService.extractWCAGCriteria(code)).toBe('1.4.3');
    });

    it('should handle empty code', () => {
      expect(Pa11yService.extractWCAGLevel('')).toBe('Unknown');
      expect(Pa11yService.extractWCAGCriteria('')).toBeNull();
      expect(Pa11yService.extractPrinciple('')).toBe('unknown');
    });

    it('should handle score calculation with zero weight', () => {
      const score = Pa11yService.calculateScore([], [], []);
      expect(score.score).toBe(100);
    });

    it('should handle very large number of issues', () => {
      const manyErrors = Array(1000)
        .fill(null)
        .map(() => ({ type: 'error' }));
      const score = Pa11yService.calculateScore(manyErrors, [], []);

      expect(score.score).toBe(0);
      expect(score.errors).toBe(1000);
    });
  });
});
