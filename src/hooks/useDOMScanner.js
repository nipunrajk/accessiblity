/**
 * useDOMScanner Hook
 * Handles DOM element scanning operations
 */

import { useState } from 'react';
import analysisAPI from '../services/api/analysis.api';
import { handleError, createAnalysisError } from '../utils/errorHandler';
import logger from '../utils/logger';

/**
 * @typedef {Object} ScannedElement
 * @property {string} selector - CSS selector for the element
 * @property {string} type - Type of issue
 * @property {string} description - Issue description
 * @property {string} severity - Issue severity level
 */

/**
 * Custom hook for DOM element scanning
 * @returns {Object} DOM scanner state and methods
 *
 * @example
 * const { scanElements, loading, error } = useDOMScanner();
 *
 * const elements = await scanElements('https://example.com');
 * console.log(`Found ${elements.length} elements with issues`);
 */
export const useDOMScanner = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannedElements, setScannedElements] = useState([]);

  /**
   * Scan website elements for accessibility issues
   * @param {string} url - Website URL to scan
   * @returns {Promise<Array>} Array of scanned elements with issues
   *
   * @example
   * const elements = await scanElements('https://example.com');
   * elements.forEach(element => {
   *   console.log(`Issue: ${element.type} - ${element.description}`);
   * });
   */
  const scanElements = async (url) => {
    setLoading(true);
    setError(null);
    setScannedElements([]);

    try {
      logger.info('Starting DOM element scanning', { url });

      const response = await analysisAPI.scanElements(url);
      const elements = Array.isArray(response.elements)
        ? response.elements
        : [];

      setScannedElements(elements);
      logger.success('DOM scanning completed', {
        url,
        elementCount: elements.length,
      });

      return elements;
    } catch (err) {
      const scanError = createAnalysisError('DOM scanning failed', err, {
        url,
      });
      const errorInfo = handleError(scanError);
      setError(errorInfo.message);
      logger.warn('Element scanning failed, continuing with basic analysis', {
        error: err.message,
      });
      // Return empty array on error to allow analysis to continue
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Analyze specific elements on a page
   * @param {string} url - Website URL
   * @param {string} selector - CSS selector for elements
   * @param {string|string[]} targetTag - Target HTML tag(s)
   * @param {boolean} directOnly - Use direct selectors only
   * @returns {Promise<Object>} Element analysis results
   *
   * @example
   * const result = await analyzeElements(
   *   'https://example.com',
   *   'img:not([alt])',
   *   'img',
   *   true
   * );
   */
  const analyzeElements = async (
    url,
    selector,
    targetTag,
    directOnly = true
  ) => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Analyzing specific elements', { url, selector, targetTag });

      const response = await analysisAPI.analyzeElements(
        url,
        selector,
        targetTag,
        directOnly
      );

      logger.success('Element analysis completed', {
        url,
        elementCount: response.elements?.length || 0,
      });

      return response;
    } catch (err) {
      const analysisError = createAnalysisError(
        'Element analysis failed',
        err,
        { url, selector }
      );
      const errorInfo = handleError(analysisError);
      setError(errorInfo.message);
      logger.error('Element analysis failed', err, { url, selector });
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
   * Clear scanned elements
   */
  const clearElements = () => {
    setScannedElements([]);
  };

  return {
    scanElements,
    analyzeElements,
    loading,
    error,
    scannedElements,
    clearError,
    clearElements,
  };
};
