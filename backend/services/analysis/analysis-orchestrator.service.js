import lighthouseService from './lighthouse.service.js';
import axeService from './axe.service.js';
import resultsMerger from './results-merger.service.js';
import { aiAnalysisService } from '../ai/index.js';
import logger from '../../utils/logger.js';
import { createInternalError } from '../../utils/errorHandler.js';

/**
 * Analysis Orchestrator Service
 * Coordinates Lighthouse, Axe-Core, and AI analysis
 * Handles parallel execution and progress tracking
 */
class AnalysisOrchestratorService {
  /**
   * Run complete website analysis
   * @param {Object} options - Analysis options
   * @param {string} options.url - URL to analyze
   * @param {boolean} options.includeAI - Include AI analysis
   * @param {boolean} options.includeAxe - Include Axe-Core analysis
   * @param {Function} options.onProgress - Progress callback
   * @returns {Promise<Object>} Complete analysis results
   */
  async analyzeWebsite(options) {
    const { url, includeAI = true, includeAxe = true, onProgress } = options;

    logger.info('Starting website analysis orchestration', {
      url,
      includeAI,
      includeAxe,
    });

    try {
      // Send initial progress
      this._sendProgress(onProgress, {
        message: 'Starting website analysis...',
        progress: 0,
      });

      // Run Lighthouse and optionally Axe in parallel
      const analysisPromises = [this._runLighthouseAnalysis(url, onProgress)];

      if (includeAxe) {
        this._sendProgress(onProgress, {
          message: 'Running Axe-Core accessibility analysis...',
          progress: 10,
        });
        analysisPromises.push(this._runAxeAnalysis(url));
      }

      const startTime = Date.now();
      const [scanResults, axeResults] = await Promise.all(analysisPromises);
      const parallelAnalysisTime = Date.now() - startTime;

      logger.performance('Parallel analysis completed', {
        duration: parallelAnalysisTime,
        includedAxe: includeAxe,
      });

      // Extract main results
      const mainResults = scanResults.urls[0]?.scores || {
        performance: { score: 0 },
        accessibility: { score: 0 },
        bestPractices: { score: 0 },
        seo: { score: 0 },
      };

      // Merge results if Axe was included
      let finalResults = mainResults;
      if (includeAxe && axeResults) {
        this._sendProgress(onProgress, {
          message: 'Merging Lighthouse and Axe-Core results...',
          progress: 60,
        });

        finalResults = resultsMerger.mergeResults(
          {
            url,
            ...mainResults,
          },
          axeResults
        );

        logger.success('Combined analysis completed', {
          lighthouseScore: mainResults.accessibility?.score,
          axeScore: axeService.calculateScore(axeResults).score,
          combinedScore: finalResults.scores?.combined,
        });
      }

      // Build base response
      const baseResponse = {
        ...finalResults,
        scanStats: {
          pagesScanned: scanResults.stats.pagesScanned,
          totalPages: scanResults.stats.totalPages,
          scannedUrls: scanResults.urls.map((u) => u.url),
        },
        axeEnabled: includeAxe,
      };

      this._sendProgress(onProgress, {
        ...baseResponse,
        progress: 70,
      });

      // Generate AI insights and fixes in parallel if requested
      let aiInsights = null;
      let aiFixes = null;

      if (includeAI) {
        const aiStartTime = Date.now();
        const aiResults = await this._runAIAnalysisParallel(
          mainResults,
          scanResults,
          onProgress
        );
        const aiAnalysisTime = Date.now() - aiStartTime;

        logger.performance('AI analysis completed', {
          duration: aiAnalysisTime,
        });

        aiInsights = aiResults.insights;
        aiFixes = aiResults.fixes;
      }

      // Send final response
      const finalResponse = {
        ...baseResponse,
        aiInsights,
        aiFixes,
        done: true,
        progress: 100,
      };

      logger.success('Website analysis orchestration completed', {
        url,
        includeAI,
        includeAxe,
      });

      return finalResponse;
    } catch (error) {
      logger.error('Analysis orchestration failed', error, { url });
      throw createInternalError('Analysis orchestration failed', error);
    }
  }

  /**
   * Run Lighthouse analysis
   * @private
   */
  async _runLighthouseAnalysis(url, onProgress) {
    logger.info('Running Lighthouse analysis', { url });

    const sendProgress = (progress) => {
      this._sendProgress(onProgress, progress);
    };

    const results = await lighthouseService.scanWebsite(url, sendProgress);

    logger.success('Lighthouse analysis completed', {
      pagesScanned: results.stats.pagesScanned,
    });

    return results;
  }

  /**
   * Run Axe-Core analysis
   * @private
   */
  async _runAxeAnalysis(url) {
    logger.info('Running Axe-Core analysis', { url });

    const results = await axeService.analyzePage(url);

    logger.success('Axe-Core analysis completed', {
      violations: results.violations.length,
    });

    return results;
  }

  /**
   * Run AI analysis (insights and fixes) in parallel
   * @private
   */
  async _runAIAnalysisParallel(mainResults, scanResults, onProgress) {
    logger.info('Running AI analysis in parallel');

    try {
      // Collect all issues for fix generation
      const allIssues = [];
      scanResults.urls.forEach((urlResult) => {
        if (urlResult.scores) {
          // Collect issues from all categories
          ['performance', 'accessibility', 'bestPractices', 'seo'].forEach(
            (category) => {
              if (urlResult.scores[category]?.issues) {
                allIssues.push(...urlResult.scores[category].issues);
              }
            }
          );
        }
      });

      // Run insights and fixes generation in parallel
      this._sendProgress(onProgress, {
        message: 'Generating AI insights and fixes...',
        progress: 75,
      });

      const aiPromises = [aiAnalysisService.generateInsights(mainResults)];

      if (allIssues.length > 0) {
        aiPromises.push(aiAnalysisService.generateFixes(allIssues));
      }

      const [insights, fixes = null] = await Promise.all(aiPromises);

      if (insights) {
        this._sendProgress(onProgress, {
          message: 'AI insights generated',
          progress: 85,
        });
      }

      if (fixes) {
        this._sendProgress(onProgress, {
          message: 'AI fixes generated',
          progress: 95,
        });
      }

      logger.success('AI analysis completed', {
        hasInsights: !!insights,
        hasFixes: !!fixes,
      });

      return { insights, fixes };
    } catch (error) {
      logger.error('AI analysis failed', error);
      // Don't throw - AI is optional
      return { insights: null, fixes: null };
    }
  }

  /**
   * Run AI analysis (insights and fixes) - Legacy sequential method
   * @private
   * @deprecated Use _runAIAnalysisParallel for better performance
   */
  async _runAIAnalysis(mainResults, scanResults, onProgress) {
    logger.info('Running AI analysis');

    let insights = null;
    let fixes = null;

    try {
      // Generate AI insights
      this._sendProgress(onProgress, {
        message: 'Generating AI insights...',
        progress: 75,
      });

      insights = await aiAnalysisService.generateInsights(mainResults);

      if (insights) {
        this._sendProgress(onProgress, {
          message: 'AI insights generated',
          progress: 85,
        });
      }

      // Generate AI fixes for issues if available
      const allIssues = [];
      scanResults.urls.forEach((urlResult) => {
        if (urlResult.scores) {
          // Collect issues from all categories
          ['performance', 'accessibility', 'bestPractices', 'seo'].forEach(
            (category) => {
              if (urlResult.scores[category]?.issues) {
                allIssues.push(...urlResult.scores[category].issues);
              }
            }
          );
        }
      });

      if (allIssues.length > 0) {
        this._sendProgress(onProgress, {
          message: 'Generating AI-powered fixes...',
          progress: 90,
        });

        fixes = await aiAnalysisService.generateFixes(allIssues);

        if (fixes) {
          this._sendProgress(onProgress, {
            message: 'AI fixes generated',
            progress: 95,
          });
        }
      }

      logger.success('AI analysis completed', {
        hasInsights: !!insights,
        hasFixes: !!fixes,
      });
    } catch (error) {
      logger.error('AI analysis failed', error);
      // Don't throw - AI is optional
    }

    return { insights, fixes };
  }

  /**
   * Send progress update
   * @private
   */
  _sendProgress(callback, data) {
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  }
}

export default new AnalysisOrchestratorService();
