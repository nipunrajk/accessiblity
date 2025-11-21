/**
 * useAIAnalysis Hook
 * Handles AI analysis and fix generation operations
 */

import { useState } from 'react';
import aiAPI from '../services/api/ai.api';
import { isAIAvailable } from '../config/aiConfig';
import { handleError, createAIProviderError } from '../utils/errorHandler';
import logger from '../utils/logger';

/**
 * @typedef {Object} AIFixSuggestion
 * @property {string} description - Fix description
 * @property {string} code - Code example
 * @property {string} impact - Expected impact
 * @property {string} implementation - Implementation steps
 */

/**
 * Custom hook for AI analysis and fix generation
 * @returns {Object} AI analysis state and methods
 *
 * @example
 * const { runAIAnalysis, generateFixes, loading, aiAvailable } = useAIAnalysis();
 *
 * if (aiAvailable) {
 *   const analysis = await runAIAnalysis(results);
 *   const fixes = await generateFixes(issues);
 * }
 */
export const useAIAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiAvailable] = useState(isAIAvailable());

  /**
   * Run AI analysis on website results
   * @param {Object} results - Analysis results to analyze
   * @returns {Promise<string|null>} AI-generated insights or null if unavailable
   *
   * @example
   * const insights = await runAIAnalysis(analysisResults);
   * if (insights) {
   *   console.log(insights);
   * }
   */
  const runAIAnalysis = async (results) => {
    if (!aiAvailable) {
      logger.info('AI analysis skipped - AI not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Starting AI analysis');

      const analysis = await aiAPI.getAnalysis(results);

      if (analysis) {
        logger.success('AI analysis completed');
        return analysis;
      }

      logger.warn('AI analysis returned no results');
      return null;
    } catch (err) {
      const aiError = createAIProviderError('AI analysis failed', err);
      const errorInfo = handleError(aiError);
      setError(errorInfo.message);
      logger.warn('AI analysis unavailable, continuing without AI insights', {
        error: err.message,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate AI fix suggestions for issues
   * @param {Array} issues - Array of issues to get fixes for
   * @returns {Promise<Object|null>} Fix suggestions or null if unavailable
   *
   * @example
   * const fixes = await generateFixes(allIssues);
   * if (fixes) {
   *   Object.keys(fixes).forEach(issueTitle => {
   *     console.log(`Fixes for ${issueTitle}:`, fixes[issueTitle]);
   *   });
   * }
   */
  const generateFixes = async (issues) => {
    if (!aiAvailable) {
      logger.info('AI fix generation skipped - AI not available');
      return null;
    }

    if (!issues || issues.length === 0) {
      logger.info('No issues to generate fixes for');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Generating AI fix suggestions', {
        issueCount: issues.length,
      });

      const fixes = await aiAPI.getFixes(issues);

      if (fixes) {
        const fixCount = Object.keys(fixes).length;
        logger.success('AI fixes generated', { fixCount });
        return fixes;
      }

      logger.warn('AI fix generation returned no results');
      return null;
    } catch (err) {
      const aiError = createAIProviderError('AI fix generation failed', err);
      const errorInfo = handleError(aiError);
      setError(errorInfo.message);
      logger.warn('AI fixes unavailable, continuing without fix suggestions', {
        error: err.message,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if AI service is currently available
   * @returns {Promise<boolean>} True if AI is available
   */
  const checkAvailability = async () => {
    try {
      return await aiAPI.checkAvailability();
    } catch (err) {
      logger.debug('AI availability check failed', { error: err.message });
      return false;
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    runAIAnalysis,
    generateFixes,
    checkAvailability,
    loading,
    error,
    aiAvailable,
    clearError,
  };
};
