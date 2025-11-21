/**
 * AI Controller
 * Handles HTTP requests for AI-powered analysis and recommendations
 *
 * This controller focuses on HTTP concerns (validation, request/response handling)
 * and delegates business logic to the AI analysis service.
 *
 * @module controllers/ai
 */

import { aiAnalysisService } from '../services/ai/index.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * AI Controller Class
 * Manages AI analysis and fixes endpoints
 */
class AIController {
  /**
   * Creates an instance of AIController
   *
   * @param {Object} aiService - AI analysis service instance
   */
  constructor(aiService) {
    this.aiService = aiService;
  }

  /**
   * Handles AI analysis generation request
   *
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {Object} req.body.results - Analysis results to generate insights from
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * POST /api/ai/analysis
   * Body: { results: { performance: {...}, accessibility: {...}, ... } }
   */
  async getAnalysis(req, res) {
    try {
      const { results } = req.body;

      // Validate input
      if (!results) {
        logger.warn('AI analysis requested without results');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Analysis results are required',
        });
      }

      // Check AI availability
      if (!this.aiService.isAvailable()) {
        logger.warn(MESSAGES.AI_UNAVAILABLE);
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: MESSAGES.AI_UNAVAILABLE,
        });
      }

      // Generate insights
      logger.info('Generating AI analysis');
      const analysis = await this.aiService.generateInsights(results);

      if (!analysis) {
        logger.warn('AI analysis returned no results');
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: 'Failed to generate AI analysis',
        });
      }

      // Send response
      logger.success('AI analysis completed');
      res.json({ analysis });
    } catch (error) {
      logger.error('AI Analysis failed', error);

      // Get environment from config
      const { config } = await import('../config/index.js');
      const isDevelopment = config.app.server.env === 'development';

      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: 'Failed to generate AI analysis',
        details: error.message,
        stack: isDevelopment ? error.stack : undefined,
      });
    }
  }

  /**
   * Handles AI fixes generation request
   *
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {Array<Object>} req.body.issues - Array of issues to generate fixes for
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * POST /api/ai/fixes
   * Body: { issues: [{ type: 'accessibility', title: '...', ... }] }
   */
  async getFixes(req, res) {
    try {
      const { issues } = req.body;

      // Validate input
      if (!issues || !Array.isArray(issues)) {
        logger.warn('AI fixes requested without valid issues array');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Issues array is required',
        });
      }

      // Check AI availability
      if (!this.aiService.isAvailable()) {
        logger.warn(MESSAGES.AI_UNAVAILABLE);
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: MESSAGES.AI_UNAVAILABLE,
        });
      }

      // Generate fixes
      logger.info('Generating AI fixes', { issueCount: issues.length });
      const suggestions = await this.aiService.generateFixes(issues);

      if (!suggestions) {
        logger.warn('AI fixes returned no results');
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: 'Failed to generate AI fixes',
        });
      }

      // Send response
      logger.success('AI fixes generated', {
        fixCount: Object.keys(suggestions).length,
      });
      res.json({ suggestions });
    } catch (error) {
      logger.error('AI Fixes failed', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: 'Failed to generate AI fixes',
        details: error.message,
      });
    }
  }
}

// Export singleton instance with injected service
export default new AIController(aiAnalysisService);
