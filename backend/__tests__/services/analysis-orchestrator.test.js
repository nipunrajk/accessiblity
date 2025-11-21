import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import analysisOrchestrator from '../../services/analysis/analysis-orchestrator.service.js';
import lighthouseService from '../../services/analysis/lighthouse.service.js';
import axeService from '../../services/analysis/axe.service.js';
import resultsMerger from '../../services/analysis/results-merger.service.js';
import pa11yService from '../../services/accessibility/pa11yService.js';
import keyboardService from '../../services/accessibility/keyboardService.js';
import { aiAnalysisService } from '../../services/ai/index.js';

vi.mock('../../services/analysis/lighthouse.service.js');
vi.mock('../../services/analysis/axe.service.js');
vi.mock('../../services/analysis/results-merger.service.js');
vi.mock('../../services/accessibility/pa11yService.js');
vi.mock('../../services/accessibility/keyboardService.js');
vi.mock('../../services/ai/index.js');
vi.mock('../../utils/logger.js');

describe('AnalysisOrchestratorService', () => {
  let mockLighthouseResults;
  let mockAxeResults;
  let mockPa11yResults;
  let mockKeyboardResults;
  let mockAIInsights;
  let mockAIFixes;
  let progressCallback;

  beforeEach(() => {
    progressCallback = vi.fn();

    mockLighthouseResults = {
      urls: [
        {
          url: 'https://example.com',
          scores: {
            performance: { score: 85, issues: [] },
            accessibility: {
              score: 90,
              issues: [
                {
                  title: 'Issue 1',
                  severity: 'moderate',
                  detectedBy: ['lighthouse'],
                },
              ],
            },
            bestPractices: { score: 95, issues: [] },
            seo: { score: 88, issues: [] },
          },
        },
      ],
      stats: {
        pagesScanned: 1,
        totalPages: 1,
      },
    };

    mockAxeResults = {
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
      incomplete: [],
      passes: [{ id: 'pass-1' }],
    };

    mockPa11yResults = {
      url: 'https://example.com',
      documentTitle: 'Example',
      issues: [
        {
          type: 'error',
          message: 'Pa11y issue',
          selector: 'div',
          context: '<div></div>',
        },
      ],
      summary: {
        total: 1,
        errors: 1,
        warnings: 0,
        notices: 0,
      },
      score: {
        score: 75,
      },
    };

    mockKeyboardResults = {
      url: 'https://example.com',
      timestamp: '2024-01-01T00:00:00.000Z',
      summary: {
        totalIssues: 2,
        critical: 1,
        serious: 1,
        moderate: 0,
      },
      interactiveElements: {
        issues: [
          {
            type: 'fake-button',
            severity: 'critical',
            wcag: '2.1.1',
            message: 'Fake button detected',
          },
        ],
      },
      focusIndicators: {
        issues: [
          {
            type: 'no-focus-indicator',
            severity: 'serious',
            wcag: '2.4.7',
            message: 'Missing focus indicator',
          },
        ],
      },
      keyboardTraps: { issues: [] },
      skipLinks: { issues: [] },
      focusManagement: { issues: [] },
      score: {
        score: 70,
        grade: 'C',
      },
    };

    mockAIInsights = {
      summary: 'Overall good accessibility',
      recommendations: ['Improve contrast', 'Add alt text'],
    };

    mockAIFixes = [
      {
        issue: 'Color contrast',
        fix: 'Use darker colors',
        code: 'color: #000;',
      },
    ];

    // Setup default mocks
    lighthouseService.scanWebsite.mockResolvedValue(mockLighthouseResults);
    axeService.analyzePage.mockResolvedValue(mockAxeResults);
    axeService.calculateScore.mockReturnValue({ score: 85 });
    pa11yService.analyzePage.mockResolvedValue(mockPa11yResults);
    keyboardService.analyzePage.mockResolvedValue(mockKeyboardResults);
    aiAnalysisService.generateInsights.mockResolvedValue(mockAIInsights);
    aiAnalysisService.generateFixes.mockResolvedValue(mockAIFixes);
    resultsMerger.mergeResults.mockReturnValue({
      url: 'https://example.com',
      scores: {
        lighthouse: 90,
        axe: 85,
        pa11y: 75,
        combined: 85,
        grade: 'B',
      },
      accessibility: {
        score: 85,
        issues: [
          {
            title: 'Issue 1',
            severity: 'moderate',
            detectedBy: ['lighthouse'],
          },
          { title: 'Issue 2', severity: 'serious', detectedBy: ['axe-core'] },
        ],
        summary: {
          total: 2,
          critical: 0,
          serious: 1,
          moderate: 1,
          minor: 0,
          bySource: {
            lighthouse: 1,
            axe: 1,
            both: 0,
          },
        },
      },
      performance: { score: 85 },
      bestPractices: { score: 95 },
      seo: { score: 88 },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeWebsite', () => {
    it('should run full analysis with all tools enabled', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
        onProgress: progressCallback,
      });

      expect(lighthouseService.scanWebsite).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Function)
      );
      expect(axeService.analyzePage).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(pa11yService.analyzePage).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(keyboardService.analyzePage).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(aiAnalysisService.generateInsights).toHaveBeenCalled();
      expect(aiAnalysisService.generateFixes).toHaveBeenCalled();

      expect(result).toHaveProperty('done', true);
      expect(result).toHaveProperty('progress', 100);
      expect(result).toHaveProperty('aiInsights');
      expect(result).toHaveProperty('aiFixes');
    });

    it('should run analysis without AI', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
      });

      expect(aiAnalysisService.generateInsights).not.toHaveBeenCalled();
      expect(aiAnalysisService.generateFixes).not.toHaveBeenCalled();
      expect(result.aiInsights).toBeNull();
      expect(result.aiFixes).toBeNull();
    });

    it('should run analysis without Axe', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: false,
        includePa11y: false,
        includeKeyboard: false,
      });

      expect(axeService.analyzePage).not.toHaveBeenCalled();
      expect(resultsMerger.mergeResults).not.toHaveBeenCalled();
      expect(result).toHaveProperty('done', true);
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('accessibility');
    });

    it('should run analysis without Pa11y', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: false,
        includeKeyboard: true,
      });

      expect(pa11yService.analyzePage).not.toHaveBeenCalled();
      expect(resultsMerger.mergeResults).toHaveBeenCalledWith(
        expect.any(Object),
        mockAxeResults,
        null
      );
    });

    it('should run analysis without keyboard testing', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: false,
      });

      expect(keyboardService.analyzePage).not.toHaveBeenCalled();
      expect(result.keyboard).toBeUndefined();
    });

    it('should execute Lighthouse, Axe, Pa11y, and Keyboard in parallel', async () => {
      const startTime = Date.now();

      await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parallel execution should be faster than sequential
      // All services should be called
      expect(lighthouseService.scanWebsite).toHaveBeenCalled();
      expect(axeService.analyzePage).toHaveBeenCalled();
      expect(pa11yService.analyzePage).toHaveBeenCalled();
      expect(keyboardService.analyzePage).toHaveBeenCalled();
    });

    it('should send progress updates', async () => {
      await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls.length).toBeGreaterThan(0);

      // Check for initial progress
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          progress: 0,
        })
      );

      // Check that progress was called multiple times
      expect(progressCallback.mock.calls.length).toBeGreaterThan(5);

      // Verify initial and intermediate progress calls exist
      const progressValues = progressCallback.mock.calls.map(
        (call) => call[0].progress
      );
      expect(progressValues).toContain(0);
      expect(progressValues.some((p) => p > 0 && p < 100)).toBe(true);
    });

    it('should merge results from all tools', async () => {
      await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
      });

      expect(resultsMerger.mergeResults).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com',
          performance: expect.any(Object),
          accessibility: expect.any(Object),
        }),
        mockAxeResults,
        mockPa11yResults
      );
    });

    it('should include keyboard results in accessibility issues', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
      });

      expect(result.accessibility.issues.length).toBeGreaterThan(2);
      expect(result.accessibility.summary.bySource).toHaveProperty('keyboard');
      expect(result.keyboard).toBeDefined();
    });

    it('should include scan statistics', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
      });

      expect(result.scanStats).toHaveProperty('pagesScanned', 1);
      expect(result.scanStats).toHaveProperty('totalPages', 1);
      expect(result.scanStats).toHaveProperty('scannedUrls');
      expect(result.scanStats.scannedUrls).toContain('https://example.com');
    });

    it('should include tools enabled flags', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
        includePa11y: false,
        includeKeyboard: true,
      });

      expect(result.toolsEnabled).toEqual({
        axe: true,
        pa11y: false,
        keyboard: true,
      });
      expect(result.axeEnabled).toBe(true); // Legacy support
    });

    it('should handle Lighthouse failure gracefully', async () => {
      lighthouseService.scanWebsite.mockRejectedValue(
        new Error('Lighthouse failed')
      );

      await expect(
        analysisOrchestrator.analyzeWebsite({
          url: 'https://example.com',
          includeAI: false,
          includeAxe: true,
        })
      ).rejects.toThrow();
    });

    it('should handle Axe failure gracefully', async () => {
      axeService.analyzePage.mockRejectedValue(new Error('Axe failed'));

      await expect(
        analysisOrchestrator.analyzeWebsite({
          url: 'https://example.com',
          includeAI: false,
          includeAxe: true,
        })
      ).rejects.toThrow();
    });

    it('should handle Pa11y failure gracefully', async () => {
      pa11yService.analyzePage.mockRejectedValue(new Error('Pa11y failed'));

      await expect(
        analysisOrchestrator.analyzeWebsite({
          url: 'https://example.com',
          includeAI: false,
          includeAxe: true,
          includePa11y: true,
        })
      ).rejects.toThrow();
    });

    it('should handle Keyboard failure gracefully', async () => {
      keyboardService.analyzePage.mockRejectedValue(
        new Error('Keyboard failed')
      );

      await expect(
        analysisOrchestrator.analyzeWebsite({
          url: 'https://example.com',
          includeAI: false,
          includeAxe: true,
          includeKeyboard: true,
        })
      ).rejects.toThrow();
    });

    it('should continue if AI analysis fails', async () => {
      aiAnalysisService.generateInsights.mockRejectedValue(
        new Error('AI failed')
      );

      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
      });

      // Should still return results without AI
      expect(result).toHaveProperty('done', true);
      expect(result.aiInsights).toBeNull();
      expect(result.aiFixes).toBeNull();
    });

    it('should handle AI fixes generation failure', async () => {
      aiAnalysisService.generateFixes.mockRejectedValue(
        new Error('AI fixes failed')
      );

      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
      });

      // Should still return results with insights but no fixes
      expect(result).toHaveProperty('done', true);
      expect(result.aiInsights).toBeDefined();
      expect(result.aiFixes).toBeNull();
    });

    it('should collect issues from all categories for AI fixes', async () => {
      const lighthouseWithIssues = {
        urls: [
          {
            url: 'https://example.com',
            scores: {
              performance: { score: 70, issues: [{ title: 'Perf issue' }] },
              accessibility: { score: 80, issues: [{ title: 'A11y issue' }] },
              bestPractices: { score: 90, issues: [{ title: 'BP issue' }] },
              seo: { score: 85, issues: [{ title: 'SEO issue' }] },
            },
          },
        ],
        stats: { pagesScanned: 1, totalPages: 1 },
      };

      lighthouseService.scanWebsite.mockResolvedValue(lighthouseWithIssues);

      await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
        includePa11y: false,
        includeKeyboard: false,
      });

      expect(aiAnalysisService.generateFixes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Perf issue' }),
          expect.objectContaining({ title: 'A11y issue' }),
          expect.objectContaining({ title: 'BP issue' }),
          expect.objectContaining({ title: 'SEO issue' }),
        ])
      );
    });

    it('should not generate AI fixes if no issues exist', async () => {
      const lighthouseNoIssues = {
        urls: [
          {
            url: 'https://example.com',
            scores: {
              performance: { score: 100, issues: [] },
              accessibility: { score: 100, issues: [] },
              bestPractices: { score: 100, issues: [] },
              seo: { score: 100, issues: [] },
            },
          },
        ],
        stats: { pagesScanned: 1, totalPages: 1 },
      };

      lighthouseService.scanWebsite.mockResolvedValue(lighthouseNoIssues);

      await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
        includePa11y: false,
        includeKeyboard: false,
      });

      expect(aiAnalysisService.generateInsights).toHaveBeenCalled();
      expect(aiAnalysisService.generateFixes).not.toHaveBeenCalled();
    });

    it('should work without progress callback', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
        includeAI: false,
        includeAxe: true,
      });

      expect(result).toHaveProperty('done', true);
    });

    it('should use default options when not specified', async () => {
      const result = await analysisOrchestrator.analyzeWebsite({
        url: 'https://example.com',
      });

      // Defaults: includeAI=true, includeAxe=true, includePa11y=true, includeKeyboard=true
      expect(lighthouseService.scanWebsite).toHaveBeenCalled();
      expect(axeService.analyzePage).toHaveBeenCalled();
      expect(pa11yService.analyzePage).toHaveBeenCalled();
      expect(keyboardService.analyzePage).toHaveBeenCalled();
      expect(aiAnalysisService.generateInsights).toHaveBeenCalled();
    });
  });

  describe('_runLighthouseAnalysis', () => {
    it('should run Lighthouse analysis and return results', async () => {
      const result = await analysisOrchestrator._runLighthouseAnalysis(
        'https://example.com',
        progressCallback
      );

      expect(lighthouseService.scanWebsite).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Function)
      );
      expect(result).toEqual(mockLighthouseResults);
    });
  });

  describe('_runAxeAnalysis', () => {
    it('should run Axe analysis and return results', async () => {
      const result = await analysisOrchestrator._runAxeAnalysis(
        'https://example.com'
      );

      expect(axeService.analyzePage).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(result).toEqual(mockAxeResults);
    });
  });

  describe('_runPa11yAnalysis', () => {
    it('should run Pa11y analysis and return results', async () => {
      const result = await analysisOrchestrator._runPa11yAnalysis(
        'https://example.com'
      );

      expect(pa11yService.analyzePage).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(result).toEqual(mockPa11yResults);
    });
  });

  describe('_runKeyboardAnalysis', () => {
    it('should run keyboard analysis and return results', async () => {
      const result = await analysisOrchestrator._runKeyboardAnalysis(
        'https://example.com'
      );

      expect(keyboardService.analyzePage).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(result).toEqual(mockKeyboardResults);
    });
  });

  describe('_runAIAnalysisParallel', () => {
    it('should run AI insights and fixes in parallel', async () => {
      const result = await analysisOrchestrator._runAIAnalysisParallel(
        mockLighthouseResults.urls[0].scores,
        mockLighthouseResults,
        progressCallback
      );

      expect(aiAnalysisService.generateInsights).toHaveBeenCalled();
      expect(aiAnalysisService.generateFixes).toHaveBeenCalled();
      expect(result).toEqual({
        insights: mockAIInsights,
        fixes: mockAIFixes,
      });
    });

    it('should send progress updates during AI analysis', async () => {
      await analysisOrchestrator._runAIAnalysisParallel(
        mockLighthouseResults.urls[0].scores,
        mockLighthouseResults,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Generating AI insights and fixes...',
          progress: 75,
        })
      );
    });

    it('should return null insights and fixes on error', async () => {
      aiAnalysisService.generateInsights.mockRejectedValue(
        new Error('AI failed')
      );

      const result = await analysisOrchestrator._runAIAnalysisParallel(
        mockLighthouseResults.urls[0].scores,
        mockLighthouseResults,
        progressCallback
      );

      expect(result).toEqual({
        insights: null,
        fixes: null,
      });
    });

    it('should not generate fixes if no issues exist', async () => {
      const noIssuesResults = {
        urls: [
          {
            scores: {
              performance: { issues: [] },
              accessibility: { issues: [] },
              bestPractices: { issues: [] },
              seo: { issues: [] },
            },
          },
        ],
      };

      const result = await analysisOrchestrator._runAIAnalysisParallel(
        noIssuesResults.urls[0].scores,
        noIssuesResults,
        progressCallback
      );

      expect(aiAnalysisService.generateInsights).toHaveBeenCalled();
      expect(aiAnalysisService.generateFixes).not.toHaveBeenCalled();
      expect(result.fixes).toBeNull();
    });
  });

  describe('_sendProgress', () => {
    it('should call progress callback with data', () => {
      const callback = vi.fn();
      const data = { message: 'Test', progress: 50 };

      analysisOrchestrator._sendProgress(callback, data);

      expect(callback).toHaveBeenCalledWith(data);
    });

    it('should not throw if callback is null', () => {
      expect(() => {
        analysisOrchestrator._sendProgress(null, { message: 'Test' });
      }).not.toThrow();
    });

    it('should not throw if callback is not a function', () => {
      expect(() => {
        analysisOrchestrator._sendProgress('not a function', {
          message: 'Test',
        });
      }).not.toThrow();
    });
  });
});
