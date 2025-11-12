import aiAnalysisService from '../services/aiAnalysisService.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import logger from '../utils/logger.js';

class AIController {
  async getAnalysis(req, res) {
    try {
      const { results } = req.body;

      if (!results) {
        logger.warn('AI analysis requested without results');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Analysis results are required',
        });
      }

      logger.info('Generating AI analysis');
      const analysis = await aiAnalysisService.generateInsights(results);

      if (!analysis) {
        logger.warn(MESSAGES.AI_UNAVAILABLE);
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: MESSAGES.AI_UNAVAILABLE,
        });
      }

      logger.success('AI analysis completed');
      res.json({ analysis });
    } catch (error) {
      logger.error('AI Analysis failed', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: 'Failed to generate AI analysis',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  async getFixes(req, res) {
    try {
      const { issues } = req.body;

      if (!issues || !Array.isArray(issues)) {
        logger.warn('AI fixes requested without valid issues array');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Issues array is required',
        });
      }

      logger.info('Generating AI fixes', { issueCount: issues.length });
      const suggestions = await aiAnalysisService.generateFixes(issues);

      if (!suggestions) {
        logger.warn(MESSAGES.AI_UNAVAILABLE);
        return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: MESSAGES.AI_UNAVAILABLE,
        });
      }

      logger.success('AI fixes generated', {
        fixCount: Object.keys(suggestions).length,
      });
      res.json({ suggestions });
    } catch (error) {
      logger.error('AI Fixes failed', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: 'Failed to generate AI fixes',
      });
    }
  }
}

export default new AIController();
