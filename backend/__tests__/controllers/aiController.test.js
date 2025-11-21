import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import aiController from '../../controllers/aiController.js';
import { HTTP_STATUS, MESSAGES } from '../../constants/index.js';

vi.mock('../../utils/logger.js');
vi.mock('../../services/ai/index.js', () => ({
  aiAnalysisService: {
    isAvailable: vi.fn(),
    generateInsights: vi.fn(),
    generateFixes: vi.fn(),
  },
}));

// Import the mocked service
import { aiAnalysisService } from '../../services/ai/index.js';

describe('AIController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
    };

    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    // Reset mocks
    aiAnalysisService.isAvailable.mockReturnValue(true);
    aiAnalysisService.generateInsights.mockReset();
    aiAnalysisService.generateFixes.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAnalysis', () => {
    it('should validate that results are provided', async () => {
      mockReq.body = {};

      await aiController.getAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Analysis results are required',
      });
    });

    it('should check AI availability before processing', async () => {
      mockReq.body = {
        results: { performance: { score: 90 } },
      };
      aiAnalysisService.isAvailable.mockReturnValue(false);

      await aiController.getAnalysis(mockReq, mockRes);

      expect(aiAnalysisService.isAvailable).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        error: MESSAGES.AI_UNAVAILABLE,
      });
    });

    it('should generate insights when AI is available', async () => {
      const mockResults = {
        performance: { score: 90 },
        accessibility: { score: 85 },
      };
      const mockAnalysis = {
        summary: 'Good performance',
        recommendations: ['Improve accessibility'],
      };

      mockReq.body = { results: mockResults };
      aiAnalysisService.generateInsights.mockResolvedValue(mockAnalysis);

      await aiController.getAnalysis(mockReq, mockRes);

      expect(aiAnalysisService.generateInsights).toHaveBeenCalledWith(
        mockResults
      );
      expect(mockRes.json).toHaveBeenCalledWith({ analysis: mockAnalysis });
    });

    it('should handle when AI returns no results', async () => {
      mockReq.body = {
        results: { performance: { score: 90 } },
      };
      aiAnalysisService.generateInsights.mockResolvedValue(null);

      await aiController.getAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to generate AI analysis',
      });
    });

    it('should handle AI service errors', async () => {
      mockReq.body = {
        results: { performance: { score: 90 } },
      };
      const error = new Error('AI service error');
      aiAnalysisService.generateInsights.mockRejectedValue(error);

      // Mock config import
      vi.doMock('../../config/index.js', () => ({
        config: {
          app: {
            server: {
              env: 'production',
            },
          },
        },
      }));

      await aiController.getAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to generate AI analysis',
        details: 'AI service error',
        stack: undefined,
      });
    });

    it('should include stack trace in development mode', async () => {
      mockReq.body = {
        results: { performance: { score: 90 } },
      };
      const error = new Error('AI service error');
      error.stack = 'Error stack trace';
      aiAnalysisService.generateInsights.mockRejectedValue(error);

      // Mock config import for development
      vi.doMock('../../config/index.js', () => ({
        config: {
          app: {
            server: {
              env: 'development',
            },
          },
        },
      }));

      await aiController.getAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to generate AI analysis',
          details: 'AI service error',
        })
      );
    });

    it('should accept complex results object', async () => {
      const complexResults = {
        performance: {
          score: 90,
          issues: [{ title: 'Issue 1' }],
        },
        accessibility: {
          score: 85,
          issues: [{ title: 'Issue 2' }],
        },
        bestPractices: {
          score: 95,
        },
        seo: {
          score: 88,
        },
      };
      const mockAnalysis = { summary: 'Analysis complete' };

      mockReq.body = { results: complexResults };
      aiAnalysisService.generateInsights.mockResolvedValue(mockAnalysis);

      await aiController.getAnalysis(mockReq, mockRes);

      expect(aiAnalysisService.generateInsights).toHaveBeenCalledWith(
        complexResults
      );
      expect(mockRes.json).toHaveBeenCalledWith({ analysis: mockAnalysis });
    });

    it('should not call generateInsights if results are missing', async () => {
      mockReq.body = {};

      await aiController.getAnalysis(mockReq, mockRes);

      expect(aiAnalysisService.generateInsights).not.toHaveBeenCalled();
    });

    it('should not call generateInsights if AI is unavailable', async () => {
      mockReq.body = { results: { performance: { score: 90 } } };
      aiAnalysisService.isAvailable.mockReturnValue(false);

      await aiController.getAnalysis(mockReq, mockRes);

      expect(aiAnalysisService.generateInsights).not.toHaveBeenCalled();
    });
  });

  describe('getFixes', () => {
    it('should validate that issues array is provided', async () => {
      mockReq.body = {};

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Issues array is required',
      });
    });

    it('should validate that issues is an array', async () => {
      mockReq.body = { issues: 'not an array' };

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Issues array is required',
      });
    });

    it('should check AI availability before processing', async () => {
      mockReq.body = {
        issues: [{ type: 'accessibility', title: 'Issue 1' }],
      };
      aiAnalysisService.isAvailable.mockReturnValue(false);

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.isAvailable).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        error: MESSAGES.AI_UNAVAILABLE,
      });
    });

    it('should generate fixes when AI is available', async () => {
      const mockIssues = [
        { type: 'accessibility', title: 'Missing alt text' },
        { type: 'performance', title: 'Large images' },
      ];
      const mockSuggestions = {
        'Missing alt text': {
          fix: 'Add alt attribute',
          code: '<img alt="description">',
        },
        'Large images': {
          fix: 'Optimize images',
          code: 'Use WebP format',
        },
      };

      mockReq.body = { issues: mockIssues };
      aiAnalysisService.generateFixes.mockResolvedValue(mockSuggestions);

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.generateFixes).toHaveBeenCalledWith(mockIssues);
      expect(mockRes.json).toHaveBeenCalledWith({
        suggestions: mockSuggestions,
      });
    });

    it('should handle when AI returns no fixes', async () => {
      mockReq.body = {
        issues: [{ type: 'accessibility', title: 'Issue 1' }],
      };
      aiAnalysisService.generateFixes.mockResolvedValue(null);

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to generate AI fixes',
      });
    });

    it('should handle AI service errors', async () => {
      mockReq.body = {
        issues: [{ type: 'accessibility', title: 'Issue 1' }],
      };
      const error = new Error('AI service error');
      aiAnalysisService.generateFixes.mockRejectedValue(error);

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to generate AI fixes',
        details: 'AI service error',
      });
    });

    it('should handle empty issues array', async () => {
      mockReq.body = { issues: [] };
      const mockSuggestions = {};

      aiAnalysisService.generateFixes.mockResolvedValue(mockSuggestions);

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.generateFixes).toHaveBeenCalledWith([]);
      expect(mockRes.json).toHaveBeenCalledWith({
        suggestions: mockSuggestions,
      });
    });

    it('should handle large issues array', async () => {
      const largeIssuesArray = Array(100)
        .fill(null)
        .map((_, i) => ({
          type: 'accessibility',
          title: `Issue ${i}`,
        }));
      const mockSuggestions = { fix: 'Multiple fixes' };

      mockReq.body = { issues: largeIssuesArray };
      aiAnalysisService.generateFixes.mockResolvedValue(mockSuggestions);

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.generateFixes).toHaveBeenCalledWith(
        largeIssuesArray
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        suggestions: mockSuggestions,
      });
    });

    it('should not call generateFixes if issues are missing', async () => {
      mockReq.body = {};

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.generateFixes).not.toHaveBeenCalled();
    });

    it('should not call generateFixes if issues is not an array', async () => {
      mockReq.body = { issues: 'not an array' };

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.generateFixes).not.toHaveBeenCalled();
    });

    it('should not call generateFixes if AI is unavailable', async () => {
      mockReq.body = { issues: [{ type: 'accessibility', title: 'Issue 1' }] };
      aiAnalysisService.isAvailable.mockReturnValue(false);

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.generateFixes).not.toHaveBeenCalled();
    });
  });

  describe('AI availability checks', () => {
    it('should check availability for getAnalysis', async () => {
      mockReq.body = { results: { performance: { score: 90 } } };
      aiAnalysisService.isAvailable.mockReturnValue(true);
      aiAnalysisService.generateInsights.mockResolvedValue({ summary: 'Test' });

      await aiController.getAnalysis(mockReq, mockRes);

      expect(aiAnalysisService.isAvailable).toHaveBeenCalled();
    });

    it('should check availability for getFixes', async () => {
      mockReq.body = { issues: [{ type: 'accessibility', title: 'Issue' }] };
      aiAnalysisService.isAvailable.mockReturnValue(true);
      aiAnalysisService.generateFixes.mockResolvedValue({ fix: 'Test' });

      await aiController.getFixes(mockReq, mockRes);

      expect(aiAnalysisService.isAvailable).toHaveBeenCalled();
    });
  });

  describe('Input validation', () => {
    it('should reject null results in getAnalysis', async () => {
      mockReq.body = { results: null };

      await aiController.getAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject undefined results in getAnalysis', async () => {
      mockReq.body = { results: undefined };

      await aiController.getAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject null issues in getFixes', async () => {
      mockReq.body = { issues: null };

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject undefined issues in getFixes', async () => {
      mockReq.body = { issues: undefined };

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject object instead of array for issues', async () => {
      mockReq.body = { issues: { type: 'accessibility' } };

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject number instead of array for issues', async () => {
      mockReq.body = { issues: 123 };

      await aiController.getFixes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('Response handling', () => {
    it('should return 200 OK for successful analysis', async () => {
      mockReq.body = { results: { performance: { score: 90 } } };
      aiAnalysisService.generateInsights.mockResolvedValue({ summary: 'Test' });

      await aiController.getAnalysis(mockReq, mockRes);

      // Should not call status (defaults to 200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ analysis: expect.any(Object) })
      );
    });

    it('should return 200 OK for successful fixes', async () => {
      mockReq.body = { issues: [{ type: 'accessibility', title: 'Issue' }] };
      aiAnalysisService.generateFixes.mockResolvedValue({ fix: 'Test' });

      await aiController.getFixes(mockReq, mockRes);

      // Should not call status (defaults to 200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ suggestions: expect.any(Object) })
      );
    });

    it('should return proper error structure', async () => {
      mockReq.body = {};

      await aiController.getAnalysis(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });

  describe('Controller instance', () => {
    it('should have aiService property', () => {
      expect(aiController.aiService).toBeDefined();
      expect(aiController.aiService).toHaveProperty('isAvailable');
      expect(aiController.aiService).toHaveProperty('generateInsights');
      expect(aiController.aiService).toHaveProperty('generateFixes');
    });
  });
});
