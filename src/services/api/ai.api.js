/**
 * AI API Module
 * Handles all AI-related API calls
 */

import apiService from './api.service.js';
import logger from '../../utils/logger.js';
import { TIMEOUTS } from '../../constants/timeouts.js';
import { createAIProviderError } from '../../utils/errorHandler.js';

/**
 * @typedef {Object} AIAnalysisResult
 * @property {string} analysis - AI-generated analysis text
 */

/**
 * @typedef {Object} AIFixSuggestions
 * @property {Object} suggestions - Fix suggestions keyed by issue title
 */

class AIAPI {
  constructor(api = apiService) {
    this.api = api;
  }

  /**
   * Get AI analysis for website results
   * @param {Object} results - Analysis results to analyze
   * @param {number} timeout - Request timeout in milliseconds
   * @returns {Promise<string|null>} AI analysis or null if unavailable
   *
   * @example
   * const analysis = await aiAPI.getAnalysis(results);
   * if (analysis) {
   *   console.log(analysis);
   * }
   */
  async getAnalysis(results, timeout = TIMEOUTS.AI_ANALYSIS) {
    try {
      logger.info('Requesting AI analysis');

      const response = await Promise.race([
        this.api.post('/api/ai-analysis', { results }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI Analysis timeout')), timeout)
        ),
      ]);

      if (response && response.analysis) {
        logger.success('AI analysis completed');
        return response.analysis;
      }

      logger.warn('AI analysis returned empty response');
      return null;
    } catch (error) {
      const aiError = createAIProviderError('AI analysis failed', error);
      logger.warn('AI analysis unavailable', { error: error.message });
      return null;
    }
  }

  /**
   * Get AI-generated fix suggestions for issues
   * @param {Array} issues - Array of issues to get fixes for
   * @param {number} timeout - Request timeout in milliseconds
   * @returns {Promise<Object|null>} Fix suggestions or null if unavailable
   *
   * @example
   * const fixes = await aiAPI.getFixes(issues);
   * if (fixes) {
   *   Object.keys(fixes).forEach(issueTitle => {
   *     console.log(`Fixes for ${issueTitle}:`, fixes[issueTitle]);
   *   });
   * }
   */
  async getFixes(issues, timeout = TIMEOUTS.AI_FIXES) {
    try {
      logger.info('Requesting AI fix suggestions', {
        issueCount: issues.length,
      });

      const response = await Promise.race([
        this.api.post('/api/ai-fixes', { issues }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI Fixes timeout')), timeout)
        ),
      ]);

      if (response && response.suggestions) {
        const fixCount = Object.keys(response.suggestions).length;
        logger.success('AI fixes generated', { fixCount });

        // Transform the response to match expected format
        const transformedSuggestions = {};
        Object.keys(response.suggestions).forEach((issueTitle) => {
          transformedSuggestions[issueTitle] = response.suggestions[
            issueTitle
          ].map((rec) => ({
            description: rec.description,
            code: rec.codeExample,
            impact: rec.expectedImpact,
            implementation: rec.implementation,
          }));
        });

        return transformedSuggestions;
      }

      logger.warn('AI fixes returned empty response');
      return null;
    } catch (error) {
      const aiError = createAIProviderError('AI fixes failed', error);
      logger.warn('AI fixes unavailable', { error: error.message });
      return null;
    }
  }

  /**
   * Check if AI service is available
   * @returns {Promise<boolean>} True if AI is available
   *
   * @example
   * const available = await aiAPI.checkAvailability();
   * if (available) {
   *   // Proceed with AI features
   * }
   */
  async checkAvailability() {
    try {
      const response = await this.api.get('/api/ai-status', {
        timeout: 5000,
        skipRetry: true,
      });

      return response && response.available === true;
    } catch (error) {
      logger.debug('AI availability check failed', { error: error.message });
      return false;
    }
  }
}

// Export singleton instance
export default new AIAPI();

// Export class for testing or custom instances
export { AIAPI };
