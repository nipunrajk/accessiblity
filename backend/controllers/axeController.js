import axeService from '../services/accessibility/axeService.js';
import axeResultsParser from '../services/accessibility/axeResultsParser.js';
import resultsMerger from '../services/accessibility/resultsMerger.js';
import lighthouseService from '../services/lighthouseService.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

class AxeController {
  /**
   * Analyze single URL with Axe-Core
   * POST /api/axe/analyze
   */
  analyzePage = asyncHandler(async (req, res) => {
    const { url, wcagLevel, options } = req.body;

    if (!url) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'URL is required',
      });
    }

    logger.info('Axe-Core analysis requested', { url, wcagLevel });

    // Run Axe analysis
    const axeResults = wcagLevel
      ? await axeService.analyzeByWCAGLevel(url, wcagLevel)
      : await axeService.analyzePage(url, options);

    // Parse and format results
    const formattedResults = axeResultsParser.formatForFrontend(axeResults);

    // Calculate score
    const score = axeService.calculateScore(axeResults);

    res.json({
      success: true,
      data: {
        ...formattedResults,
        score,
      },
    });
  });

  /**
   * Analyze with combined Lighthouse + Axe
   * POST /api/axe/combined
   */
  analyzeCombined = asyncHandler(async (req, res) => {
    const { url, options } = req.body;

    if (!url) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'URL is required',
      });
    }

    logger.info('Combined Lighthouse + Axe analysis requested', { url });

    // Run both analyses in parallel
    const [lighthouseResults, axeResults] = await Promise.all([
      lighthouseService.scanWebsite(url, () => {}),
      axeService.analyzePage(url, options),
    ]);

    // Merge results
    const mergedResults = resultsMerger.mergeResults(
      {
        url,
        accessibility: lighthouseResults.urls[0]?.scores?.accessibility,
        performance: lighthouseResults.urls[0]?.scores?.performance,
        bestPractices: lighthouseResults.urls[0]?.scores?.bestPractices,
        seo: lighthouseResults.urls[0]?.scores?.seo,
      },
      axeResults
    );

    res.json({
      success: true,
      data: mergedResults,
    });
  });

  /**
   * Analyze multiple pages
   * POST /api/axe/analyze-batch
   */
  analyzeBatch = asyncHandler(async (req, res) => {
    const { urls, options } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'URLs array is required',
      });
    }

    logger.info('Batch Axe analysis requested', { urlCount: urls.length });

    // Set up SSE for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const results = await axeService.analyzeMultiplePages(
      urls,
      options,
      (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      }
    );

    // Send final results
    res.write(
      `data: ${JSON.stringify({
        done: true,
        results,
      })}\n\n`
    );
    res.end();
  });

  /**
   * Get violations only (faster)
   * POST /api/axe/violations
   */
  getViolations = asyncHandler(async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'URL is required',
      });
    }

    logger.info('Axe violations-only analysis requested', { url });

    const results = await axeService.getViolationsOnly(url);
    const violations = axeResultsParser.parseViolations(results.violations);

    res.json({
      success: true,
      data: {
        url,
        violations,
        count: violations.length,
      },
    });
  });

  /**
   * Analyze specific element
   * POST /api/axe/analyze-element
   */
  analyzeElement = asyncHandler(async (req, res) => {
    const { url, selector } = req.body;

    if (!url || !selector) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'URL and selector are required',
      });
    }

    logger.info('Axe element analysis requested', { url, selector });

    const results = await axeService.analyzeElement(url, selector);
    const formatted = axeResultsParser.formatForFrontend(results);

    res.json({
      success: true,
      data: formatted,
    });
  });

  /**
   * Get available Axe rules
   * GET /api/axe/rules
   */
  getRules = asyncHandler(async (req, res) => {
    logger.info('Axe rules requested');

    const rules = await axeService.getAvailableRules();

    res.json({
      success: true,
      data: {
        rules,
        count: rules.length,
      },
    });
  });

  /**
   * Get WCAG tags
   * GET /api/axe/tags
   */
  getTags = asyncHandler(async (req, res) => {
    const tags = {
      wcag2a: 'WCAG 2.0 Level A',
      wcag2aa: 'WCAG 2.0 Level AA',
      wcag2aaa: 'WCAG 2.0 Level AAA',
      wcag21a: 'WCAG 2.1 Level A',
      wcag21aa: 'WCAG 2.1 Level AA',
      wcag21aaa: 'WCAG 2.1 Level AAA',
      wcag22aa: 'WCAG 2.2 Level AA',
      'best-practice': 'Best Practices',
      experimental: 'Experimental Rules',
    };

    res.json({
      success: true,
      data: tags,
    });
  });
}

export default new AxeController();
