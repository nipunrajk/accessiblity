/**
 * useLighthouse Hook
 * Handles Lighthouse analysis operations
 */

import { useState } from 'react';
import analysisAPI from '../services/api/analysis.api';
import { handleError, createAnalysisError } from '../utils/errorHandler';
import logger from '../utils/logger';

/**
 * @typedef {Object} LighthouseResult
 * @property {Object} performance - Performance analysis results
 * @property {Object} accessibility - Accessibility analysis results
 * @property {Object} bestPractices - Best practices analysis results
 * @property {Object} seo - SEO analysis results
 * @property {Object} scanStats - Scan statistics
 */

/**
 * Custom hook for running Lighthouse analysis
 * @returns {Object} Lighthouse analysis state and methods
 *
 * @example
 * const { runLighthouse, loading, error } = useLighthouse();
 *
 * const results = await runLighthouse('https://example.com', (progress) => {
 *   console.log(`Scanned ${progress.pagesScanned} pages`);
 * });
 */
export const useLighthouse = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanStats, setScanStats] = useState({
    pagesScanned: 0,
    totalPages: 0,
    scannedUrls: [],
  });

  /**
   * Run Lighthouse analysis on a website
   * @param {string} url - Website URL to analyze
   * @param {Function} onProgress - Progress callback function
   * @param {Object} options - Analysis options
   * @returns {Promise<LighthouseResult>} Analysis results
   * @throws {Error} When analysis fails
   */
  const runLighthouse = async (url, onProgress = null, options = {}) => {
    setLoading(true);
    setError(null);
    setScanStats({ pagesScanned: 0, totalPages: 0, scannedUrls: [] });

    try {
      logger.info('Starting Lighthouse analysis', { url });

      const results = await analysisAPI.analyzeWebsite(
        url,
        {
          includeAxe: options.includeAxe !== false,
          includeAI: false, // Lighthouse doesn't need AI
        },
        (progress) => {
          setScanStats(progress);
          if (onProgress) {
            onProgress(progress);
          }
        }
      );

      logger.success('Lighthouse analysis completed', { url });

      return {
        performance: results.performance,
        accessibility: results.accessibility,
        bestPractices: results.bestPractices,
        seo: results.seo,
        scanStats: results.scanStats,
      };
    } catch (err) {
      const analysisError = createAnalysisError(
        'Lighthouse analysis failed',
        err,
        { url }
      );
      const errorInfo = handleError(analysisError);
      setError(errorInfo.message);
      logger.error('Lighthouse analysis failed', err, { url });
      throw analysisError;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Reset scan stats
   */
  const resetStats = () => {
    setScanStats({ pagesScanned: 0, totalPages: 0, scannedUrls: [] });
  };

  return {
    runLighthouse,
    loading,
    error,
    scanStats,
    clearError,
    resetStats,
  };
};
