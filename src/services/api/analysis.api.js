/**
 * Analysis API Module
 * Handles all analysis-related API calls
 */

import apiService from './api.service.js';
import logger from '../../utils/logger.js';
import { ERROR_MESSAGES } from '../../constants/index.js';

/**
 * @typedef {Object} AnalysisOptions
 * @property {boolean} [includeAxe] - Include Axe-Core analysis
 * @property {boolean} [includeAI] - Include AI analysis
 */

/**
 * @typedef {Object} AnalysisProgress
 * @property {number} pagesScanned - Number of pages scanned
 * @property {number} totalPages - Total pages to scan
 * @property {string[]} scannedUrls - Array of scanned URLs
 * @property {string} [message] - Progress message
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {Object} performance - Performance analysis results
 * @property {Object} accessibility - Accessibility analysis results
 * @property {Object} bestPractices - Best practices analysis results
 * @property {Object} seo - SEO analysis results
 * @property {Object} scanStats - Scan statistics
 * @property {boolean} [axeEnabled] - Whether Axe analysis was enabled
 */

class AnalysisAPI {
  constructor(api = apiService) {
    this.api = api;
  }

  /**
   * Analyze a website using Lighthouse and optionally Axe-Core
   * @param {string} url - Website URL to analyze
   * @param {AnalysisOptions} options - Analysis options
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<AnalysisResult>} Analysis results
   * @throws {Error} When analysis fails
   *
   * @example
   * const results = await analysisAPI.analyzeWebsite(
   *   'https://example.com',
   *   { includeAxe: true, includeAI: true },
   *   (progress) => console.log(progress)
   * );
   */
  async analyzeWebsite(url, options = {}, onProgress = null) {
    try {
      const { includeAxe = true, includeAI = true } = options;

      logger.info('Starting website analysis', { url, includeAxe, includeAI });

      const response = await this.api.request('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          url,
          includeAxe,
          includeAI,
        }),
        skipRetry: true, // Don't retry SSE requests
      });

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.ANALYSIS_FAILED);
      }

      // Handle Server-Sent Events (SSE)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on double newlines and process complete messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();

              // Validate JSON structure
              if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
                logger.warn('Malformed JSON structure in SSE', {
                  starts_with: jsonStr.substring(0, 1),
                  ends_with: jsonStr.substring(jsonStr.length - 1),
                });
                continue;
              }

              const data = JSON.parse(jsonStr);

              if (data.error) {
                logger.error('Backend error in analysis', data.error);
                throw new Error(`Backend error: ${data.error}`);
              }

              if (data.done) {
                logger.success('Website analysis completed', { url });

                return {
                  scores: data.scores || {
                    lighthouse: data.accessibility?.score || 0,
                    axe: 0,
                    combined: data.accessibility?.score || 0,
                    grade: 'F',
                  },
                  performance: {
                    score: data.performance?.score || 0,
                    issues: data.performance?.issues || [],
                    metrics: data.performance?.metrics || {},
                  },
                  accessibility: {
                    score:
                      data.accessibility?.score || data.scores?.combined || 0,
                    issues: data.accessibility?.issues || [],
                    violations: data.accessibility?.violations || [],
                    incomplete: data.accessibility?.incomplete || [],
                    passes: data.accessibility?.passes || [],
                    wcagCompliance: data.accessibility?.wcagCompliance || null,
                  },
                  bestPractices: {
                    score: data.bestPractices?.score || 0,
                    issues: data.bestPractices?.issues || [],
                  },
                  seo: {
                    score: data.seo?.score || 0,
                    issues: data.seo?.issues || [],
                  },
                  scanStats: {
                    pagesScanned: data.scanStats?.pagesScanned || 0,
                    totalPages: data.scanStats?.totalPages || 0,
                    scannedUrls: data.scanStats?.scannedUrls || [],
                  },
                  axeEnabled: data.axeEnabled || false,
                };
              }

              // Handle progress updates
              if (onProgress && data.pagesScanned !== undefined) {
                onProgress(data);
              }
            } catch (parseError) {
              logger.error('Failed to parse SSE data', parseError);

              if (parseError instanceof SyntaxError) {
                // Continue instead of throwing to handle partial updates
                continue;
              }
              throw parseError;
            }
          }
        }
      }

      throw new Error('Analysis stream ended without completion');
    } catch (error) {
      logger.error('Website analysis failed', error, { url });
      throw new Error(`Failed to analyze website: ${error.message}`);
    }
  }

  /**
   * Scan website elements for accessibility issues
   * @param {string} url - Website URL to scan
   * @returns {Promise<Object>} Scanned elements data
   * @throws {Error} When scanning fails
   *
   * @example
   * const { elements } = await analysisAPI.scanElements('https://example.com');
   */
  async scanElements(url) {
    try {
      logger.info('Starting element scanning', { url });

      const response = await this.api.post('/api/scan-elements', { url });

      logger.success('Element scanning completed', {
        url,
        elementCount: response.elements?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Element scanning failed', error, { url });
      throw new Error(`Failed to scan website elements: ${error.message}`);
    }
  }

  /**
   * Analyze specific elements on a page
   * @param {string} url - Website URL
   * @param {string} selector - CSS selector for elements
   * @param {string|string[]} targetTag - Target HTML tag(s)
   * @param {boolean} directOnly - Use direct selectors only
   * @returns {Promise<Object>} Element analysis results
   * @throws {Error} When analysis fails
   *
   * @example
   * const result = await analysisAPI.analyzeElements(
   *   'https://example.com',
   *   'img:not([alt])',
   *   'img',
   *   true
   * );
   */
  async analyzeElements(url, selector, targetTag, directOnly = true) {
    try {
      logger.info('Analyzing elements', { url, selector, targetTag });

      const response = await this.api.post('/api/analyze-elements', {
        url,
        selector,
        targetTag,
        directOnly,
      });

      logger.success('Element analysis completed', {
        url,
        elementCount: response.elements?.length || 0,
      });

      return response;
    } catch (error) {
      logger.error('Element analysis failed', error, { url, selector });
      throw new Error(`Failed to analyze elements: ${error.message}`);
    }
  }

  /**
   * Validate a fix applied to an element
   * @param {Object} issue - The issue being fixed
   * @param {Object} element - The element with the fix
   * @param {Object} fix - The applied fix
   * @param {string} validationType - Type of validation to perform
   * @returns {Promise<Object>} Validation results
   * @throws {Error} When validation fails
   *
   * @example
   * const result = await analysisAPI.validateFix(
   *   issue,
   *   element,
   *   appliedFix,
   *   'missing-alt'
   * );
   */
  async validateFix(issue, element, fix, validationType) {
    try {
      logger.info('Validating fix', { validationType });

      const response = await this.api.post('/api/validate-fix', {
        issue,
        element,
        fix,
        validationType,
      });

      logger.success('Fix validation completed', {
        success: response.success,
        validationType,
      });

      return response;
    } catch (error) {
      logger.error('Fix validation failed', error, { validationType });
      throw new Error(`Failed to validate fix: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new AnalysisAPI();

// Export class for testing or custom instances
export { AnalysisAPI };
