import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import analysisController from '../../controllers/analysisController.js';
import analysisOrchestrator from '../../services/analysis/analysis-orchestrator.service.js';
import { validateUrl } from '../../utils/validation.js';

vi.mock('../../services/analysis/analysis-orchestrator.service.js');
vi.mock('../../utils/validation.js');
vi.mock('../../utils/logger.js');

describe('AnalysisController', () => {
  let mockReq;
  let mockRes;
  let mockOrchestratorResults;

  beforeEach(() => {
    mockReq = {
      body: {
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
      },
    };

    mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    mockOrchestratorResults = {
      url: 'https://example.com',
      scores: {
        lighthouse: 90,
        axe: 85,
        combined: 87,
        grade: 'B',
      },
      accessibility: {
        score: 87,
        issues: [],
        summary: { total: 0 },
      },
      done: true,
      progress: 100,
    };

    validateUrl.mockImplementation((url) => url);
    analysisOrchestrator.analyzeWebsite.mockResolvedValue(
      mockOrchestratorResults
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeWebsite', () => {
    it('should set up SSE headers', async () => {
      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
    });

    it('should validate URL before analysis', async () => {
      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(validateUrl).toHaveBeenCalledWith('https://example.com');
    });

    it('should call orchestrator with validated URL and options', async () => {
      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
        onProgress: expect.any(Function),
      });
    });

    it('should use default options when not provided', async () => {
      mockReq.body = { url: 'https://example.com' };

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith({
        url: 'https://example.com',
        includeAI: true,
        includeAxe: true,
        includePa11y: true,
        includeKeyboard: true,
        onProgress: expect.any(Function),
      });
    });

    it('should stream progress updates via SSE', async () => {
      let progressCallback;
      analysisOrchestrator.analyzeWebsite.mockImplementation((options) => {
        progressCallback = options.onProgress;
        return Promise.resolve(mockOrchestratorResults);
      });

      await analysisController.analyzeWebsite(mockReq, mockRes);

      // Simulate progress update
      progressCallback({ message: 'Starting analysis', progress: 10 });

      expect(mockRes.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({
          message: 'Starting analysis',
          progress: 10,
        })}\n\n`
      );
    });

    it('should send final results via SSE', async () => {
      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify(mockOrchestratorResults)}\n\n`
      );
    });

    it('should end response after sending results', async () => {
      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should throw validation errors', async () => {
      const validationError = new Error('Invalid URL format');
      validateUrl.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        analysisController.analyzeWebsite(mockReq, mockRes)
      ).rejects.toThrow('Invalid URL format');
    });

    it('should handle orchestrator errors', async () => {
      const orchestratorError = new Error('Analysis failed');
      analysisOrchestrator.analyzeWebsite.mockRejectedValue(orchestratorError);

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({
          error: 'Failed to analyze website',
          message: 'Analysis failed',
        })}\n\n`
      );
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should handle includeAI=false', async () => {
      mockReq.body.includeAI = false;

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          includeAI: false,
        })
      );
    });

    it('should handle includeAxe=false', async () => {
      mockReq.body.includeAxe = false;

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          includeAxe: false,
        })
      );
    });

    it('should handle includePa11y=false', async () => {
      mockReq.body.includePa11y = false;

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          includePa11y: false,
        })
      );
    });

    it('should handle includeKeyboard=false', async () => {
      mockReq.body.includeKeyboard = false;

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          includeKeyboard: false,
        })
      );
    });

    it('should stream multiple progress updates', async () => {
      let progressCallback;
      analysisOrchestrator.analyzeWebsite.mockImplementation((options) => {
        progressCallback = options.onProgress;
        return Promise.resolve(mockOrchestratorResults);
      });

      await analysisController.analyzeWebsite(mockReq, mockRes);

      // Simulate multiple progress updates
      progressCallback({ message: 'Starting', progress: 0 });
      progressCallback({ message: 'Running Lighthouse', progress: 25 });
      progressCallback({ message: 'Running Axe', progress: 50 });
      progressCallback({ message: 'Generating AI', progress: 75 });

      expect(mockRes.write).toHaveBeenCalledTimes(5); // 4 progress + 1 final
    });

    it('should throw error for empty request body', async () => {
      mockReq.body = {};
      validateUrl.mockImplementation(() => {
        throw new Error('URL is required');
      });

      await expect(
        analysisController.analyzeWebsite(mockReq, mockRes)
      ).rejects.toThrow('URL is required');
    });

    it('should pass through validated URL from validator', async () => {
      validateUrl.mockReturnValue('https://validated-example.com/');

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://validated-example.com/',
        })
      );
    });
  });

  describe('scanElements', () => {
    let mockElementScanner;

    beforeEach(() => {
      mockElementScanner = {
        scanElements: vi.fn().mockResolvedValue([
          { tag: 'button', text: 'Click me', selector: 'button.primary' },
          { tag: 'a', text: 'Link', selector: 'a.nav-link' },
        ]),
      };

      // Mock dynamic import
      vi.doMock('../../services/analysis/element-scanner.service.js', () => ({
        default: mockElementScanner,
      }));
    });

    it('should validate URL before scanning', async () => {
      mockReq.body = { url: 'https://example.com' };

      await analysisController.scanElements(mockReq, mockRes);

      expect(validateUrl).toHaveBeenCalledWith('https://example.com');
    });

    it('should call element scanner with validated URL', async () => {
      mockReq.body = { url: 'https://example.com' };
      validateUrl.mockReturnValue('https://validated-example.com/');

      await analysisController.scanElements(mockReq, mockRes);

      // Wait for dynamic import
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockElementScanner.scanElements).toHaveBeenCalledWith(
        'https://validated-example.com/'
      );
    });

    it('should return success response with elements', async () => {
      mockReq.body = { url: 'https://example.com' };

      await analysisController.scanElements(mockReq, mockRes);

      // Wait for dynamic import
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        elements: expect.any(Array),
        count: expect.any(Number),
      });
    });

    it('should return element count', async () => {
      mockReq.body = { url: 'https://example.com' };

      await analysisController.scanElements(mockReq, mockRes);

      // Wait for dynamic import
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
        })
      );
    });

    it('should handle validation errors', async () => {
      mockReq.body = { url: 'invalid-url' };
      validateUrl.mockImplementation(() => {
        throw new Error('Invalid URL format');
      });

      await analysisController.scanElements(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid URL format',
      });
    });

    it('should handle scanner errors', async () => {
      mockReq.body = { url: 'https://example.com' };
      mockElementScanner.scanElements.mockRejectedValue(
        new Error('Scanner failed')
      );

      await analysisController.scanElements(mockReq, mockRes);

      // Wait for dynamic import
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Scanner failed',
      });
    });

    it('should handle missing URL in request', async () => {
      mockReq.body = {};
      validateUrl.mockImplementation(() => {
        throw new Error('URL is required');
      });

      await analysisController.scanElements(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'URL is required',
      });
    });

    it('should return empty array when no elements found', async () => {
      mockReq.body = { url: 'https://example.com' };
      mockElementScanner.scanElements.mockResolvedValue([]);

      await analysisController.scanElements(mockReq, mockRes);

      // Wait for dynamic import
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        elements: [],
        count: 0,
      });
    });
  });

  describe('SSE streaming behavior', () => {
    it('should format SSE data correctly', async () => {
      let progressCallback;
      analysisOrchestrator.analyzeWebsite.mockImplementation((options) => {
        progressCallback = options.onProgress;
        return Promise.resolve(mockOrchestratorResults);
      });

      await analysisController.analyzeWebsite(mockReq, mockRes);

      const testData = { test: 'data', progress: 50 };
      progressCallback(testData);

      expect(mockRes.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify(testData)}\n\n`
      );
    });

    it('should handle complex nested objects in SSE', async () => {
      let progressCallback;
      analysisOrchestrator.analyzeWebsite.mockImplementation((options) => {
        progressCallback = options.onProgress;
        return Promise.resolve(mockOrchestratorResults);
      });

      await analysisController.analyzeWebsite(mockReq, mockRes);

      const complexData = {
        message: 'Progress',
        progress: 50,
        details: {
          nested: {
            data: [1, 2, 3],
          },
        },
      };
      progressCallback(complexData);

      expect(mockRes.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify(complexData)}\n\n`
      );
    });

    it('should maintain connection throughout analysis', async () => {
      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({
          Connection: 'keep-alive',
        })
      );
    });

    it('should set no-cache headers for SSE', async () => {
      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({
          'Cache-Control': 'no-cache',
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should send error via SSE on orchestrator failure', async () => {
      const error = new Error('Orchestrator crashed');
      analysisOrchestrator.analyzeWebsite.mockRejectedValue(error);

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(
        expect.stringContaining('Failed to analyze website')
      );
      expect(mockRes.write).toHaveBeenCalledWith(
        expect.stringContaining('Orchestrator crashed')
      );
    });

    it('should always end response even on error', async () => {
      analysisOrchestrator.analyzeWebsite.mockRejectedValue(
        new Error('Test error')
      );

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should format error response correctly', async () => {
      const error = new Error('Test error message');
      analysisOrchestrator.analyzeWebsite.mockRejectedValue(error);

      await analysisController.analyzeWebsite(mockReq, mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({
          error: 'Failed to analyze website',
          message: 'Test error message',
        })}\n\n`
      );
    });
  });
});
