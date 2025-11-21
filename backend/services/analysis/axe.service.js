import { AxePuppeteer } from 'axe-puppeteer';
import puppeteer from 'puppeteer';
import logger from '../../utils/logger.js';
import {
  createExternalAPIError,
  createInternalError,
} from '../../utils/errorHandler.js';

/**
 * Axe-Core Service
 * Provides comprehensive WCAG 2.0/2.1/2.2 accessibility testing
 * Coverage: ~57% of WCAG issues (complements Lighthouse's ~40%)
 */
class AxeService {
  constructor() {
    this.browserConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    };

    // Default Axe configuration
    this.defaultAxeConfig = {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'], // WCAG 2.2 AA compliance
      },
      resultTypes: ['violations', 'incomplete', 'passes'],
      timeout: 30000,
    };
  }

  /**
   * Analyze a single page with Axe-Core
   * @param {string} url - URL to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Axe analysis results
   */
  async analyzePage(url, options = {}) {
    const browser = await puppeteer.launch(this.browserConfig);
    const page = await browser.newPage();

    try {
      logger.info('Starting Axe-Core analysis', { url });

      // Navigate to page
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for page to be fully loaded
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Wait for dynamic content if specified
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: 10000,
        });
      }

      // Inject axe-core if not already present
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@4.10.3/axe.min.js',
      });

      // Wait for axe to be available
      await page.waitForFunction(() => typeof window.axe !== 'undefined');

      // Run Axe analysis
      const axeConfig = {
        ...this.defaultAxeConfig,
        ...options.axeConfig,
      };

      const results = await new AxePuppeteer(page)
        .configure(axeConfig)
        .analyze();

      logger.success('Axe-Core analysis completed', {
        url,
        violations: results.violations.length,
        incomplete: results.incomplete.length,
        passes: results.passes.length,
      });

      return {
        url,
        timestamp: new Date().toISOString(),
        violations: results.violations,
        incomplete: results.incomplete,
        passes: results.passes,
        inapplicable: results.inapplicable,
        testEngine: results.testEngine,
        testRunner: results.testRunner,
        testEnvironment: results.testEnvironment,
      };
    } catch (error) {
      logger.error('Axe-Core analysis failed', error, { url });
      throw createExternalAPIError('Axe-Core', error);
    } finally {
      await browser.close();
    }
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

    logger.info('Starting multi-page Axe-Core analysis', {
      totalPages,
    });

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

    logger.success('Multi-page Axe-Core analysis completed', {
      totalPages,
      successful: results.filter((r) => r.success !== false).length,
      failed: results.filter((r) => r.success === false).length,
    });

    return results;
  }

  /**
   * Analyze with specific WCAG level
   * @param {string} url - URL to analyze
   * @param {string} level - WCAG level ('A', 'AA', 'AAA')
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeByWCAGLevel(url, level = 'AA') {
    const tagMap = {
      A: ['wcag2a', 'wcag21a', 'wcag22a'],
      AA: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      AAA: [
        'wcag2a',
        'wcag2aa',
        'wcag2aaa',
        'wcag21a',
        'wcag21aa',
        'wcag21aaa',
        'wcag22aa', // WCAG 2.2 AA (no AAA tags yet in axe-core)
      ],
    };

    const tags = tagMap[level.toUpperCase()] || tagMap.AA;

    return this.analyzePage(url, {
      axeConfig: {
        runOnly: {
          type: 'tag',
          values: tags,
        },
      },
    });
  }

  /**
   * Get only violations (faster, no passes/incomplete)
   * @param {string} url - URL to analyze
   * @returns {Promise<Object>} Violations only
   */
  async getViolationsOnly(url) {
    return this.analyzePage(url, {
      axeConfig: {
        resultTypes: ['violations'],
      },
    });
  }

  /**
   * Analyze specific element on page
   * @param {string} url - URL to analyze
   * @param {string} selector - CSS selector to analyze
   * @returns {Promise<Object>} Analysis results for element
   */
  async analyzeElement(url, selector) {
    const browser = await puppeteer.launch(this.browserConfig);
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Check if element exists
      const elementExists = await page.$(selector);
      if (!elementExists) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Run Axe on specific element
      const results = await new AxePuppeteer(page).include(selector).analyze();

      return {
        url,
        selector,
        violations: results.violations,
        incomplete: results.incomplete,
        passes: results.passes,
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Get all available Axe rules
   * @returns {Promise<Array>} List of all Axe rules
   */
  async getAvailableRules() {
    const browser = await puppeteer.launch(this.browserConfig);
    const page = await browser.newPage();

    try {
      // Create a blank page to get rules
      await page.goto('about:blank');

      const rules = await page.evaluate(() => {
        return window.axe.getRules();
      });

      return rules;
    } finally {
      await browser.close();
    }
  }

  /**
   * Calculate accessibility score from Axe results
   * @param {Object} results - Axe analysis results
   * @returns {Object} Score breakdown
   */
  calculateScore(results) {
    const { violations, incomplete, passes } = results;

    // Weight violations by impact
    const impactWeights = {
      critical: 10,
      serious: 7,
      moderate: 4,
      minor: 1,
    };

    let totalWeight = 0;
    let violationWeight = 0;

    violations.forEach((violation) => {
      const weight = impactWeights[violation.impact] || 1;
      const nodeCount = violation.nodes.length;
      violationWeight += weight * nodeCount;
      totalWeight += weight * nodeCount;
    });

    // Add incomplete as half weight
    incomplete.forEach((item) => {
      const weight = (impactWeights[item.impact] || 1) * 0.5;
      const nodeCount = item.nodes.length;
      totalWeight += weight * nodeCount;
    });

    // Add passes
    passes.forEach((pass) => {
      totalWeight += 1;
    });

    // Calculate score (0-100)
    const score =
      totalWeight > 0
        ? Math.round(((totalWeight - violationWeight) / totalWeight) * 100)
        : 100;

    return {
      score,
      violations: violations.length,
      incomplete: incomplete.length,
      passes: passes.length,
      criticalIssues: violations.filter((v) => v.impact === 'critical').length,
      seriousIssues: violations.filter((v) => v.impact === 'serious').length,
      moderateIssues: violations.filter((v) => v.impact === 'moderate').length,
      minorIssues: violations.filter((v) => v.impact === 'minor').length,
    };
  }
}

export default new AxeService();
