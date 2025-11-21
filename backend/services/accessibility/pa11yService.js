import pa11y from 'pa11y';
import logger from '../../utils/logger.js';
import { createExternalAPIError } from '../../utils/errorHandler.js';

/**
 * Pa11y Service
 * Provides HTML_CodeSniffer-based accessibility testing
 * Catches issues that axe-core might miss
 * Coverage: ~45% of WCAG issues (different perspective from Axe)
 */
class Pa11yService {
  constructor() {
    // Default Pa11y configuration
    this.defaultConfig = {
      standard: 'WCAG2AA', // WCAG2A, WCAG2AA, WCAG2AAA
      includeNotices: false,
      includeWarnings: true,
      timeout: 30000,
      wait: 2000,
      chromeLaunchConfig: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
      runners: ['htmlcs'], // HTML_CodeSniffer
    };
  }

  /**
   * Analyze a single page with Pa11y
   * @param {string} url - URL to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Pa11y analysis results
   */
  async analyzePage(url, options = {}) {
    try {
      logger.info('Starting Pa11y analysis', { url });

      const config = {
        ...this.defaultConfig,
        ...options,
      };

      const results = await pa11y(url, config);

      logger.success('Pa11y analysis completed', {
        url,
        issues: results.issues.length,
      });

      return this.formatResults(results);
    } catch (error) {
      logger.error('Pa11y analysis failed', error, { url });
      throw createExternalAPIError('Pa11y', error);
    }
  }

  /**
   * Analyze with specific WCAG level
   * @param {string} url - URL to analyze
   * @param {string} level - WCAG level ('A', 'AA', 'AAA')
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeByWCAGLevel(url, level = 'AA') {
    const standardMap = {
      A: 'WCAG2A',
      AA: 'WCAG2AA',
      AAA: 'WCAG2AAA',
    };

    const standard = standardMap[level.toUpperCase()] || 'WCAG2AA';

    return this.analyzePage(url, { standard });
  }

  /**
   * Analyze multiple pages
   * @param {Array<string>} urls - URLs to analyze
   * @param {Object} options - Analysis options
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Array>} Array of analysis results
   */
  async analyzeMultiplePages(urls, options = {}, progressCallback = null) {
    const results = [];
    const totalPages = urls.length;

    logger.info('Starting multi-page Pa11y analysis', { totalPages });

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        const result = await this.analyzePage(url, options);
        results.push(result);

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: totalPages,
            url,
            success: true,
          });
        }
      } catch (error) {
        logger.error('Failed to analyze page', error, { url });
        results.push({
          url,
          error: error.message,
          success: false,
        });

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: totalPages,
            url,
            success: false,
            error: error.message,
          });
        }
      }
    }

    logger.success('Multi-page Pa11y analysis completed', {
      totalPages,
      successful: results.filter((r) => r.success !== false).length,
      failed: results.filter((r) => r.success === false).length,
    });

    return results;
  }

  /**
   * Format Pa11y results to match our standard format
   * @private
   */
  formatResults(results) {
    const issues = results.issues.map((issue) => this.formatIssue(issue));

    // Group by type
    const errors = issues.filter((i) => i.type === 'error');
    const warnings = issues.filter((i) => i.type === 'warning');
    const notices = issues.filter((i) => i.type === 'notice');

    // Group by WCAG level
    const byWCAGLevel = this.groupByWCAGLevel(issues);

    // Group by principle
    const byPrinciple = this.groupByPrinciple(issues);

    return {
      url: results.pageUrl,
      documentTitle: results.documentTitle,
      timestamp: new Date().toISOString(),
      summary: {
        total: issues.length,
        errors: errors.length,
        warnings: warnings.length,
        notices: notices.length,
      },
      issues,
      errors,
      warnings,
      notices,
      byWCAGLevel,
      byPrinciple,
      score: this.calculateScore(errors, warnings, notices),
    };
  }

  /**
   * Format individual issue
   * @private
   */
  formatIssue(issue) {
    return {
      code: issue.code,
      type: issue.type, // error, warning, notice
      typeCode: issue.typeCode, // 1=error, 2=warning, 3=notice
      message: issue.message,
      context: issue.context,
      selector: issue.selector,
      runner: issue.runner, // htmlcs
      wcagLevel: this.extractWCAGLevel(issue.code),
      wcagCriteria: this.extractWCAGCriteria(issue.code),
      principle: this.extractPrinciple(issue.code),
      detectedBy: ['pa11y'],
    };
  }

  /**
   * Extract WCAG level from code
   * @private
   */
  extractWCAGLevel(code) {
    if (code.includes('AAA')) return 'AAA';
    if (code.includes('AA')) return 'AA';
    if (code.includes('A')) return 'A';
    return 'Unknown';
  }

  /**
   * Extract WCAG criteria from code
   * @private
   */
  extractWCAGCriteria(code) {
    // Extract pattern like "1.3.1" or "2.4.7"
    const match = code.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract WCAG principle from code
   * @private
   */
  extractPrinciple(code) {
    if (code.includes('Principle1')) return 'perceivable';
    if (code.includes('Principle2')) return 'operable';
    if (code.includes('Principle3')) return 'understandable';
    if (code.includes('Principle4')) return 'robust';

    // Fallback: extract from criteria number
    const criteria = this.extractWCAGCriteria(code);
    if (!criteria) return 'unknown';

    const firstDigit = parseInt(criteria.charAt(0));
    const principleMap = {
      1: 'perceivable',
      2: 'operable',
      3: 'understandable',
      4: 'robust',
    };

    return principleMap[firstDigit] || 'unknown';
  }

  /**
   * Group issues by WCAG level
   * @private
   */
  groupByWCAGLevel(issues) {
    return {
      A: issues.filter((i) => i.wcagLevel === 'A'),
      AA: issues.filter((i) => i.wcagLevel === 'AA'),
      AAA: issues.filter((i) => i.wcagLevel === 'AAA'),
    };
  }

  /**
   * Group issues by WCAG principle
   * @private
   */
  groupByPrinciple(issues) {
    return {
      perceivable: issues.filter((i) => i.principle === 'perceivable'),
      operable: issues.filter((i) => i.principle === 'operable'),
      understandable: issues.filter((i) => i.principle === 'understandable'),
      robust: issues.filter((i) => i.principle === 'robust'),
    };
  }

  /**
   * Calculate accessibility score
   * @private
   */
  calculateScore(errors, warnings, notices) {
    // Weight: errors = 10, warnings = 5, notices = 1
    const errorWeight = errors.length * 10;
    const warningWeight = warnings.length * 5;
    const noticeWeight = notices.length * 1;

    const totalWeight = errorWeight + warningWeight + noticeWeight;
    const maxWeight = 100; // Baseline

    // Calculate score (0-100)
    const score = Math.max(
      0,
      Math.round(100 - (totalWeight / maxWeight) * 100)
    );

    return {
      score,
      errors: errors.length,
      warnings: warnings.length,
      notices: notices.length,
      grade: this.getGrade(score),
    };
  }

  /**
   * Get letter grade from score
   * @private
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get available standards
   * @returns {Array<string>} List of available standards
   */
  getAvailableStandards() {
    return ['WCAG2A', 'WCAG2AA', 'WCAG2AAA', 'Section508'];
  }
}

export default new Pa11yService();
