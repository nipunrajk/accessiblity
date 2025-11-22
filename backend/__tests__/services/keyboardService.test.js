import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import KeyboardService from '../../services/accessibility/keyboardService.js';
import puppeteer from 'puppeteer';

vi.mock('puppeteer');
vi.mock('../../utils/logger.js');

describe('KeyboardService', () => {
  let mockBrowser;
  let mockPage;

  beforeEach(() => {
    mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn(),
    };

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    puppeteer.launch.mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzePage', () => {
    it('should analyze keyboard accessibility successfully', async () => {
      const mockResults = {
        interactiveElements: { passed: true, issues: [] },
        tabOrder: { passed: true, issues: [] },
        focusIndicators: { passed: true, issues: [] },
        keyboardTraps: { passed: true, issues: [] },
        skipLinks: { passed: true, issues: [] },
        focusManagement: { passed: true, issues: [] },
      };

      mockPage.evaluate
        .mockResolvedValueOnce(mockResults.interactiveElements)
        .mockResolvedValueOnce(mockResults.tabOrder)
        .mockResolvedValueOnce(mockResults.focusIndicators)
        .mockResolvedValueOnce(mockResults.keyboardTraps)
        .mockResolvedValueOnce(mockResults.skipLinks)
        .mockResolvedValueOnce(mockResults.focusManagement);

      const result = await KeyboardService.analyzePage('https://example.com');

      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('interactiveElements');
      expect(result).toHaveProperty('tabOrder');
      expect(result).toHaveProperty('focusIndicators');
      expect(result).toHaveProperty('keyboardTraps');
      expect(result).toHaveProperty('skipLinks');
      expect(result).toHaveProperty('focusManagement');
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle analysis errors and close browser', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(
        KeyboardService.analyzePage('https://example.com')
      ).rejects.toThrow();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should set correct viewport and wait for page load', async () => {
      mockPage.evaluate.mockResolvedValue({ passed: true, issues: [] });

      await KeyboardService.analyzePage('https://example.com');

      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1920,
        height: 1080,
      });
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ waitUntil: 'networkidle2' })
      );
    });
  });

  describe('testInteractiveElements', () => {
    it('should detect accessible interactive elements', async () => {
      const mockResult = {
        total: 5,
        accessible: 5,
        inaccessible: 0,
        fakeButtons: 0,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testInteractiveElements(mockPage);

      expect(result.passed).toBe(true);
      expect(result.accessible).toBe(5);
      expect(result.inaccessible).toBe(0);
      expect(result.fakeButtons).toBe(0);
    });

    it('should detect fake buttons (div/span with onclick)', async () => {
      const mockResult = {
        total: 3,
        accessible: 1,
        inaccessible: 2,
        fakeButtons: 2,
        issues: [
          {
            type: 'fake-button',
            severity: 'critical',
            wcag: '2.1.1',
            element: 'div',
            message: 'Fake button (div) is not keyboard accessible',
          },
          {
            type: 'fake-button',
            severity: 'critical',
            wcag: '2.1.1',
            element: 'span',
            message: 'Fake button (span) is not keyboard accessible',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testInteractiveElements(mockPage);

      expect(result.passed).toBe(false);
      expect(result.fakeButtons).toBe(2);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].type).toBe('fake-button');
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should detect positive tabindex issues', async () => {
      const mockResult = {
        total: 3,
        accessible: 3,
        inaccessible: 0,
        fakeButtons: 0,
        issues: [
          {
            type: 'positive-tabindex',
            severity: 'moderate',
            wcag: '2.4.3',
            element: 'button',
            tabindex: 5,
            message: 'Positive tabindex disrupts natural tab order',
          },
        ],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testInteractiveElements(mockPage);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('positive-tabindex');
      expect(result.issues[0].tabindex).toBe(5);
    });

    it('should detect non-focusable clickable elements', async () => {
      const mockResult = {
        total: 2,
        accessible: 0,
        inaccessible: 2,
        fakeButtons: 0,
        issues: [
          {
            type: 'not-focusable-clickable',
            severity: 'critical',
            wcag: '2.1.1',
            element: 'div',
            message:
              'Interactive element with click handler is not keyboard accessible',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testInteractiveElements(mockPage);

      expect(result.passed).toBe(false);
      expect(result.issues[0].type).toBe('not-focusable-clickable');
    });

    it('should flag semantic issues with fake buttons', async () => {
      const mockResult = {
        total: 2,
        accessible: 2,
        inaccessible: 0,
        fakeButtons: 0,
        issues: [
          {
            type: 'fake-button-accessible',
            severity: 'moderate',
            wcag: 'best-practice',
            element: 'div',
            role: 'button',
            message: 'Using div as button instead of <button> element',
          },
        ],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testInteractiveElements(mockPage);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('fake-button-accessible');
      expect(result.issues[0].severity).toBe('moderate');
    });
  });

  describe('testTabOrder', () => {
    it('should validate logical tab order', async () => {
      const mockResult = {
        order: [
          {
            index: 0,
            element: 'button',
            tabindex: '0',
            position: { x: 10, y: 10 },
          },
          {
            index: 1,
            element: 'input',
            tabindex: '0',
            position: { x: 10, y: 50 },
          },
        ],
        totalFocusable: 2,
        logicalOrder: true,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testTabOrder(mockPage);

      expect(result.passed).toBe(true);
      expect(result.logicalOrder).toBe(true);
      expect(result.totalFocusable).toBe(2);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect illogical tab order', async () => {
      const mockResult = {
        order: [
          {
            index: 0,
            element: 'button',
            tabindex: '0',
            position: { x: 10, y: 100 },
          },
          {
            index: 1,
            element: 'input',
            tabindex: '0',
            position: { x: 10, y: 10 },
          },
        ],
        totalFocusable: 2,
        logicalOrder: false,
        issues: [
          {
            type: 'illogical-order',
            severity: 'serious',
            wcag: '2.4.3',
            element: 'input',
            message: "Focus order doesn't match visual order",
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testTabOrder(mockPage);

      expect(result.passed).toBe(false);
      expect(result.logicalOrder).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('illogical-order');
    });

    it('should track element positions in tab order', async () => {
      const mockResult = {
        order: [
          {
            index: 0,
            element: 'a',
            tabindex: '0',
            position: { x: 0, y: 0 },
            text: 'Link 1',
          },
          {
            index: 1,
            element: 'button',
            tabindex: '0',
            position: { x: 0, y: 50 },
            text: 'Button',
          },
        ],
        totalFocusable: 2,
        logicalOrder: true,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testTabOrder(mockPage);

      expect(result.order).toHaveLength(2);
      expect(result.order[0]).toHaveProperty('position');
      expect(result.order[0]).toHaveProperty('text');
    });
  });

  describe('testFocusIndicators', () => {
    it('should detect elements with focus indicators', async () => {
      const mockResult = {
        total: 5,
        withIndicator: 5,
        withoutIndicator: 0,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testFocusIndicators(mockPage);

      expect(result.passed).toBe(true);
      expect(result.withIndicator).toBe(5);
      expect(result.withoutIndicator).toBe(0);
    });

    it('should detect missing focus indicators', async () => {
      const mockResult = {
        total: 3,
        withIndicator: 1,
        withoutIndicator: 2,
        issues: [
          {
            type: 'no-focus-indicator',
            severity: 'serious',
            wcag: '2.4.7',
            element: 'button',
            message: 'Element has no visible focus indicator',
            currentStyle: {
              outline: 'none',
              boxShadow: 'none',
              border: 'none',
            },
          },
          {
            type: 'no-focus-indicator',
            severity: 'serious',
            wcag: '2.4.7',
            element: 'a',
            message: 'Element has no visible focus indicator',
            currentStyle: {
              outline: 'none',
              boxShadow: 'none',
              border: 'none',
            },
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testFocusIndicators(mockPage);

      expect(result.passed).toBe(false);
      expect(result.withoutIndicator).toBe(2);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].wcag).toBe('2.4.7');
    });

    it('should include current style information in issues', async () => {
      const mockResult = {
        total: 1,
        withIndicator: 0,
        withoutIndicator: 1,
        issues: [
          {
            type: 'no-focus-indicator',
            severity: 'serious',
            wcag: '2.4.7',
            element: 'input',
            selector: 'input.search',
            currentStyle: {
              outline: 'none',
              boxShadow: 'none',
              border: '1px solid gray',
            },
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testFocusIndicators(mockPage);

      expect(result.issues[0]).toHaveProperty('currentStyle');
      expect(result.issues[0].currentStyle).toHaveProperty('outline-solid');
      expect(result.issues[0].currentStyle).toHaveProperty('boxShadow');
    });
  });

  describe('detectKeyboardTraps', () => {
    it('should pass when no keyboard traps detected', async () => {
      const mockResult = {
        potentialTraps: 0,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.detectKeyboardTraps(mockPage);

      expect(result.passed).toBe(true);
      expect(result.potentialTraps).toBe(0);
    });

    it('should detect elements with keyboard handlers but no escape mechanism', async () => {
      const mockResult = {
        potentialTraps: 1,
        issues: [
          {
            type: 'potential-trap',
            severity: 'serious',
            wcag: '2.1.2',
            element: 'div',
            message: 'Element has keyboard handlers but no escape mechanism',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.detectKeyboardTraps(mockPage);

      expect(result.passed).toBe(false);
      expect(result.potentialTraps).toBe(1);
      expect(result.issues[0].type).toBe('potential-trap');
    });

    it('should detect modal traps without close buttons', async () => {
      const mockResult = {
        potentialTraps: 1,
        issues: [
          {
            type: 'modal-trap',
            severity: 'critical',
            wcag: '2.1.2',
            element: 'modal',
            message: 'Modal/dialog may trap keyboard focus',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.detectKeyboardTraps(mockPage);

      expect(result.passed).toBe(false);
      expect(result.issues[0].type).toBe('modal-trap');
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should count all potential traps correctly', async () => {
      const mockResult = {
        potentialTraps: 3,
        issues: [
          { type: 'potential-trap', severity: 'serious', wcag: '2.1.2' },
          { type: 'modal-trap', severity: 'critical', wcag: '2.1.2' },
          { type: 'potential-trap', severity: 'serious', wcag: '2.1.2' },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.detectKeyboardTraps(mockPage);

      expect(result.potentialTraps).toBe(3);
      expect(result.issues).toHaveLength(3);
    });
  });

  describe('testSkipLinks', () => {
    it('should pass when skip links are present and valid', async () => {
      const mockResult = {
        hasSkipLink: true,
        skipLinkCount: 1,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testSkipLinks(mockPage);

      expect(result.passed).toBe(true);
      expect(result.hasSkipLink).toBe(true);
      expect(result.skipLinkCount).toBe(1);
    });

    it('should detect missing skip links', async () => {
      const mockResult = {
        hasSkipLink: false,
        skipLinkCount: 0,
        issues: [
          {
            type: 'missing-skip-link',
            severity: 'moderate',
            wcag: '2.4.1',
            message: 'No skip link found to bypass navigation',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testSkipLinks(mockPage);

      expect(result.passed).toBe(false);
      expect(result.hasSkipLink).toBe(false);
      expect(result.issues[0].type).toBe('missing-skip-link');
    });

    it('should detect broken skip link targets', async () => {
      const mockResult = {
        hasSkipLink: true,
        skipLinkCount: 1,
        issues: [
          {
            type: 'broken-skip-link',
            severity: 'serious',
            wcag: '2.4.1',
            message: 'Skip link target "main-content" not found',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testSkipLinks(mockPage);

      expect(result.passed).toBe(false);
      expect(result.hasSkipLink).toBe(true);
      expect(result.issues[0].type).toBe('broken-skip-link');
    });

    it('should count multiple skip links', async () => {
      const mockResult = {
        hasSkipLink: true,
        skipLinkCount: 3,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testSkipLinks(mockPage);

      expect(result.skipLinkCount).toBe(3);
    });
  });

  describe('testFocusManagement', () => {
    it('should pass when focus management is correct', async () => {
      const mockResult = {
        focusHandlers: 0,
        autoFocusElements: 1,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testFocusManagement(mockPage);

      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect unexpected focus changes', async () => {
      const mockResult = {
        focusHandlers: 1,
        autoFocusElements: 0,
        issues: [
          {
            type: 'unexpected-focus-change',
            severity: 'serious',
            wcag: '3.2.1',
            element: 'input',
            message: 'Element triggers unexpected change on focus',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testFocusManagement(mockPage);

      expect(result.passed).toBe(false);
      expect(result.issues[0].type).toBe('unexpected-focus-change');
      expect(result.issues[0].wcag).toBe('3.2.1');
    });

    it('should detect multiple autofocus elements', async () => {
      const mockResult = {
        focusHandlers: 0,
        autoFocusElements: 3,
        issues: [
          {
            type: 'multiple-autofocus',
            severity: 'moderate',
            wcag: '3.2.1',
            message: 'Multiple elements have autofocus attribute',
          },
        ],
        passed: false,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testFocusManagement(mockPage);

      expect(result.passed).toBe(false);
      expect(result.autoFocusElements).toBe(3);
      expect(result.issues[0].type).toBe('multiple-autofocus');
    });

    it('should track focus handler count', async () => {
      const mockResult = {
        focusHandlers: 5,
        autoFocusElements: 1,
        issues: [],
        passed: true,
      };

      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await KeyboardService.testFocusManagement(mockPage);

      expect(result.focusHandlers).toBe(5);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary with no issues', () => {
      const testResults = [
        { passed: true, issues: [] },
        { passed: true, issues: [] },
        { passed: true, issues: [] },
      ];

      const summary = KeyboardService.generateSummary(testResults);

      expect(summary.totalIssues).toBe(0);
      expect(summary.critical).toBe(0);
      expect(summary.serious).toBe(0);
      expect(summary.moderate).toBe(0);
      expect(summary.testsPassed).toBe(3);
      expect(summary.testsFailed).toBe(0);
    });

    it('should aggregate issues by severity', () => {
      const testResults = [
        {
          passed: false,
          issues: [{ severity: 'critical' }, { severity: 'serious' }],
        },
        {
          passed: false,
          issues: [{ severity: 'moderate' }, { severity: 'critical' }],
        },
      ];

      const summary = KeyboardService.generateSummary(testResults);

      expect(summary.totalIssues).toBe(4);
      expect(summary.critical).toBe(2);
      expect(summary.serious).toBe(1);
      expect(summary.moderate).toBe(1);
      expect(summary.testsPassed).toBe(0);
      expect(summary.testsFailed).toBe(2);
    });

    it('should count passed and failed tests correctly', () => {
      const testResults = [
        { passed: true, issues: [] },
        { passed: false, issues: [{ severity: 'critical' }] },
        { passed: true, issues: [] },
        { passed: false, issues: [{ severity: 'moderate' }] },
      ];

      const summary = KeyboardService.generateSummary(testResults);

      expect(summary.testsPassed).toBe(2);
      expect(summary.testsFailed).toBe(2);
      expect(summary.totalTests).toBe(4);
    });
  });

  describe('calculateScore', () => {
    it('should return perfect score with no issues', () => {
      const testResults = [
        { passed: true, issues: [] },
        { passed: true, issues: [] },
      ];

      const score = KeyboardService.calculateScore(testResults);

      expect(score.score).toBe(100);
      expect(score.grade).toBe('A');
      expect(score.critical).toBe(0);
      expect(score.serious).toBe(0);
      expect(score.moderate).toBe(0);
    });

    it('should calculate score based on severity weights', () => {
      const testResults = [
        {
          passed: false,
          issues: [
            { severity: 'critical' }, // -15
            { severity: 'serious' }, // -10
            { severity: 'moderate' }, // -5
          ],
        },
      ];

      const score = KeyboardService.calculateScore(testResults);

      expect(score.score).toBeLessThan(100);
      expect(score.critical).toBe(1);
      expect(score.serious).toBe(1);
      expect(score.moderate).toBe(1);
    });

    it('should not go below 0 score', () => {
      const testResults = [
        {
          passed: false,
          issues: Array(20).fill({ severity: 'critical' }),
        },
      ];

      const score = KeyboardService.calculateScore(testResults);

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.grade).toBe('F');
    });

    it('should assign correct letter grades', () => {
      const testCases = [
        { score: 95, expectedGrade: 'A' },
        { score: 85, expectedGrade: 'B' },
        { score: 75, expectedGrade: 'C' },
        { score: 65, expectedGrade: 'D' },
        { score: 50, expectedGrade: 'F' },
      ];

      testCases.forEach(({ score, expectedGrade }) => {
        const grade = KeyboardService.getGrade(score);
        expect(grade).toBe(expectedGrade);
      });
    });

    it('should include test pass/fail counts in score', () => {
      const testResults = [
        { passed: true, issues: [] },
        { passed: false, issues: [{ severity: 'moderate' }] },
        { passed: true, issues: [] },
      ];

      const score = KeyboardService.calculateScore(testResults);

      expect(score.testsPassed).toBe(2);
      expect(score.testsFailed).toBe(1);
    });
  });

  describe('getGrade', () => {
    it('should return A for scores 90-100', () => {
      expect(KeyboardService.getGrade(100)).toBe('A');
      expect(KeyboardService.getGrade(95)).toBe('A');
      expect(KeyboardService.getGrade(90)).toBe('A');
    });

    it('should return B for scores 80-89', () => {
      expect(KeyboardService.getGrade(89)).toBe('B');
      expect(KeyboardService.getGrade(85)).toBe('B');
      expect(KeyboardService.getGrade(80)).toBe('B');
    });

    it('should return C for scores 70-79', () => {
      expect(KeyboardService.getGrade(79)).toBe('C');
      expect(KeyboardService.getGrade(75)).toBe('C');
      expect(KeyboardService.getGrade(70)).toBe('C');
    });

    it('should return D for scores 60-69', () => {
      expect(KeyboardService.getGrade(69)).toBe('D');
      expect(KeyboardService.getGrade(65)).toBe('D');
      expect(KeyboardService.getGrade(60)).toBe('D');
    });

    it('should return F for scores below 60', () => {
      expect(KeyboardService.getGrade(59)).toBe('F');
      expect(KeyboardService.getGrade(30)).toBe('F');
      expect(KeyboardService.getGrade(0)).toBe('F');
    });
  });
});
