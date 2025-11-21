/**
 * useAnalysis Hook
 * Main orchestration hook for website analysis
 * Coordinates Lighthouse, AI analysis, and DOM scanning
 */
import { useNavigate } from 'react-router-dom';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { useLighthouse } from './useLighthouse';
import { useAIAnalysis } from './useAIAnalysis';
import { useDOMScanner } from './useDOMScanner';
import { handleError, createAnalysisError } from '../utils/errorHandler';
import logger from '../utils/logger';

const DEMO_URL = 'https://example-demo-site.com';
const DEMO_AI_MESSAGE =
  'This demo website shows common accessibility and performance issues. The missing alt text on images makes content inaccessible to screen readers. The large unoptimized images are slowing down page load times. Consider adding descriptive alt text and optimizing image sizes for better user experience.';

/**
 * @typedef {Object} AnalysisState
 * @property {boolean} loading - Whether analysis is in progress
 * @property {Object|null} results - Analysis results
 * @property {string|null} error - Error message if analysis failed
 * @property {string|null} aiAnalysis - AI-generated insights
 * @property {boolean} aiLoading - Whether AI analysis is in progress
 * @property {Object} scanStats - Scan statistics
 * @property {Array} scannedElements - Scanned DOM elements
 * @property {Array} elementIssues - Element-specific issues
 * @property {Object|null} aiFixes - AI-generated fix suggestions
 * @property {string} websiteUrl - Currently analyzed website URL
 */

/**
 * @typedef {Object} AnalysisMethods
 * @property {Function} runAnalysis - Run complete website analysis
 * @property {Function} navigateToAiFix - Navigate to AI fix page
 * @property {Function} clearAnalysis - Clear all analysis data
 */

/**
 * Main analysis hook that orchestrates all analysis operations
 * Coordinates Lighthouse analysis, AI insights, and DOM scanning
 *
 * @returns {AnalysisState & AnalysisMethods} Analysis state and methods
 *
 * @example
 * const {
 *   loading,
 *   results,
 *   error,
 *   runAnalysis,
 *   clearAnalysis
 * } = useAnalysis();
 *
 * // Run analysis
 * await runAnalysis('https://example.com');
 *
 * // Access results
 * if (results) {
 *   console.log('Performance score:', results.performance.score);
 * }
 *
 * // Clear analysis
 * clearAnalysis();
 */
export const useAnalysis = () => {
  const {
    loading,
    results,
    error,
    aiAnalysis,
    aiLoading,
    scanStats,
    scannedElements,
    elementIssues,
    aiFixes,
    websiteUrl,
    dispatch,
    clearPersistedData,
  } = useAnalysisContext();

  const navigate = useNavigate();
  const { runLighthouse } = useLighthouse();
  const { runAIAnalysis, generateFixes, aiAvailable } = useAIAnalysis();
  const { scanElements } = useDOMScanner();

  /**
   * Clear analysis state
   * @private
   */
  const clearState = () => {
    const emptyStats = { pagesScanned: 0, totalPages: 0, scannedUrls: [] };
    dispatch({ type: 'SET_RESULTS', payload: null });
    dispatch({ type: 'SET_AI_ANALYSIS', payload: null });
    dispatch({ type: 'SET_AI_FIXES', payload: null });
    dispatch({ type: 'SET_SCAN_STATS', payload: emptyStats });
    clearPersistedData();
  };

  /**
   * Handle demo analysis with sample data
   * @private
   */
  const handleDemoAnalysis = async () => {
    try {
      const { sampleAnalysisResults } = await import('../data/sampleData.js');
      dispatch({ type: 'SET_WEBSITE_URL', payload: DEMO_URL });
      dispatch({ type: 'SET_RESULTS', payload: sampleAnalysisResults });
      dispatch({
        type: 'SET_SCAN_STATS',
        payload: { pagesScanned: 1, totalPages: 1, scannedUrls: [DEMO_URL] },
      });

      if (aiAvailable) {
        dispatch({ type: 'SET_AI_LOADING', payload: true });
        setTimeout(() => {
          dispatch({ type: 'SET_AI_ANALYSIS', payload: DEMO_AI_MESSAGE });
          dispatch({ type: 'SET_AI_LOADING', payload: false });
        }, 2000);
      }

      navigate(`/analyze/demo-${Date.now()}`);
    } catch (demoError) {
      logger.error('Failed to load demo data', demoError);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load demo data' });
    }
  };

  /**
   * Run AI processing (analysis and fix generation) in parallel
   * @private
   * @param {Object} lighthouseResults - Lighthouse analysis results
   * @param {string} url - Website URL
   */
  const runAIProcessing = async (lighthouseResults, url) => {
    dispatch({ type: 'SET_AI_LOADING', payload: true });
    try {
      const startTime = performance.now();

      // Run AI analysis, DOM scanning, and collect issues in parallel
      const [aiAnalysisResult, elements] = await Promise.all([
        runAIAnalysis(lighthouseResults),
        scanElements(url),
      ]);

      const parallelTime = performance.now() - startTime;
      logger.performance('Parallel AI processing completed', {
        duration: parallelTime,
      });

      if (aiAnalysisResult) {
        dispatch({ type: 'SET_AI_ANALYSIS', payload: aiAnalysisResult });
      }
      dispatch({ type: 'SET_SCANNED_ELEMENTS', payload: elements });
      dispatch({ type: 'SET_ELEMENT_ISSUES', payload: elements });

      // Collect all issues for fix generation
      const allIssues = [
        ...(lighthouseResults.performance?.issues || []),
        ...(lighthouseResults.accessibility?.issues || []),
        ...(lighthouseResults.bestPractices?.issues || []),
        ...(lighthouseResults.seo?.issues || []),
        ...elements,
      ];

      // Generate fixes if there are issues
      if (allIssues.length > 0) {
        const fixStartTime = performance.now();
        const fixes = await generateFixes(allIssues);
        const fixTime = performance.now() - fixStartTime;

        logger.performance('AI fix generation completed', {
          duration: fixTime,
          issueCount: allIssues.length,
        });

        if (fixes) dispatch({ type: 'SET_AI_FIXES', payload: fixes });
      }
    } catch (error) {
      logger.warn('AI processing error, continuing with basic analysis', {
        error: error.message,
      });
    } finally {
      dispatch({ type: 'SET_AI_LOADING', payload: false });
    }
  };

  /**
   * Run complete website analysis
   * @param {string} url - Website URL to analyze (use 'demo' for sample data)
   * @returns {Promise<void>}
   * @throws {Error} When analysis fails
   *
   * @example
   * // Analyze a website
   * await runAnalysis('https://example.com');
   *
   * // Load demo data
   * await runAnalysis('demo');
   */
  const runAnalysis = async (url) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    clearState();

    if (url === 'demo' || url === 'sample') {
      await handleDemoAnalysis();
      return;
    }

    dispatch({ type: 'SET_WEBSITE_URL', payload: url });

    try {
      const lighthouseResults = await runLighthouse(url, (progress) =>
        dispatch({ type: 'SET_SCAN_STATS', payload: progress })
      );

      dispatch({
        type: 'SET_RESULTS',
        payload: {
          performance: lighthouseResults.performance,
          accessibility: lighthouseResults.accessibility,
          bestPractices: lighthouseResults.bestPractices,
          seo: lighthouseResults.seo,
        },
      });
      dispatch({
        type: 'SET_SCAN_STATS',
        payload: lighthouseResults.scanStats,
      });

      if (aiAvailable) await runAIProcessing(lighthouseResults, url);

      navigate(`/analyze/${Date.now()}`);
    } catch (err) {
      const error = createAnalysisError('Website analysis failed', err, {
        url,
      });
      const errorInfo = handleError(error);
      dispatch({ type: 'SET_ERROR', payload: errorInfo.message });
      logger.error('Analysis failed', err, { url });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_AI_LOADING', payload: false });
    }
  };

  /**
   * Navigate to AI fix page with current analysis data
   * @param {string} [url] - Optional URL override
   *
   * @example
   * navigateToAiFix();
   */
  const navigateToAiFix = (url) => {
    const currentUrl = url || websiteUrl;
    const allIssues = [
      ...(results?.performance?.issues || []),
      ...(results?.accessibility?.issues || []),
      ...(results?.bestPractices?.issues || []),
      ...(results?.seo?.issues || []),
      ...(Array.isArray(elementIssues) ? elementIssues : []),
    ];

    navigate('/ai-fix', {
      state: {
        issues: allIssues,
        websiteUrl: currentUrl,
        scanStats,
        scannedElements,
        cachedAiFixes: aiFixes,
      },
    });
  };

  /**
   * Clear all analysis data and persisted state
   *
   * @example
   * clearAnalysis();
   */
  const clearAnalysis = () => {
    dispatch({ type: 'CLEAR_ALL' });
    clearPersistedData();
  };

  return {
    loading,
    results,
    error,
    aiAnalysis,
    aiLoading,
    scanStats,
    scannedElements,
    elementIssues,
    aiFixes,
    websiteUrl,
    runAnalysis,
    navigateToAiFix,
    clearAnalysis,
  };
};
