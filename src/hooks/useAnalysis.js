import { useNavigate } from 'react-router-dom';
import { runLighthouseAnalysis } from '../services/lighthouse';
import { scanWebsiteElements } from '../services/domScanner';
import { getFixSuggestions } from '../services/aiFix';
import { isAIAvailable } from '../config/aiConfig';
import { STORAGE_KEYS, API_CONFIG } from '../constants';
import { useAnalysisContext } from '../contexts/AnalysisContext';

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

  const runAnalysis = async (url) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Clear previous data
    dispatch({ type: 'SET_RESULTS', payload: null });
    dispatch({ type: 'SET_AI_ANALYSIS', payload: null });
    dispatch({ type: 'SET_AI_FIXES', payload: null });
    dispatch({
      type: 'SET_SCAN_STATS',
      payload: { pagesScanned: 0, totalPages: 0, scannedUrls: [] },
    });

    // Clear persisted data for new analysis
    clearPersistedData();

    // Handle demo/sample data case
    if (url === 'demo' || url === 'sample') {
      try {
        // Load sample data from our demo file
        const { sampleAnalysisResults } = await import('../data/sampleData.js');

        dispatch({
          type: 'SET_WEBSITE_URL',
          payload: 'https://example-demo-site.com',
        });
        dispatch({ type: 'SET_RESULTS', payload: sampleAnalysisResults });
        dispatch({
          type: 'SET_SCAN_STATS',
          payload: {
            pagesScanned: 1,
            totalPages: 1,
            scannedUrls: ['https://example-demo-site.com'],
          },
        });

        // Add some demo AI analysis if AI is available
        const hasAI = isAIAvailable();
        if (hasAI) {
          dispatch({ type: 'SET_AI_LOADING', payload: true });
          // Simulate AI analysis delay
          setTimeout(() => {
            dispatch({
              type: 'SET_AI_ANALYSIS',
              payload:
                'This demo website shows common accessibility and performance issues. The missing alt text on images makes content inaccessible to screen readers. The large unoptimized images are slowing down page load times. Consider adding descriptive alt text and optimizing image sizes for better user experience.',
            });
            dispatch({ type: 'SET_AI_LOADING', payload: false });
          }, 2000);
        }

        const analysis = { id: 'demo-' + Date.now().toString() };
        navigate(`/analyze/${analysis.id}`);
        return;
      } catch (demoError) {
        console.error('Failed to load demo data:', demoError);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load demo data' });
        return;
      }
    }

    dispatch({ type: 'SET_WEBSITE_URL', payload: url });

    try {
      const analysis = { id: Date.now().toString() };

      // Run Lighthouse analysis
      const response = await runLighthouseAnalysis(url, (progress) => {
        dispatch({ type: 'SET_SCAN_STATS', payload: progress });
      });

      const analysisResults = {
        performance: response.performance,
        accessibility: response.accessibility,
        bestPractices: response.bestPractices,
        seo: response.seo,
      };

      dispatch({ type: 'SET_RESULTS', payload: analysisResults });

      // Run AI analysis and DOM scanning in parallel for better performance
      const hasAI = isAIAvailable();
      if (hasAI) {
        dispatch({ type: 'SET_AI_LOADING', payload: true });

        // Run AI analysis and DOM scanning in parallel
        const aiPromises = [];

        // 1. AI Analysis Promise with timeout
        const aiAnalysisPromise = Promise.race([
          fetch('/api/ai-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ results: response }),
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('AI Analysis timeout after 30 seconds')),
              30000
            )
          ),
        ])
          .then(async (aiResponse) => {
            if (aiResponse.ok) {
              const { analysis } = await aiResponse.json();
              dispatch({ type: 'SET_AI_ANALYSIS', payload: analysis });
              return analysis;
            } else {
              console.error('AI Analysis failed:', aiResponse.statusText);
              dispatch({ type: 'SET_AI_ANALYSIS', payload: null });
              return null;
            }
          })
          .catch((aiError) => {
            console.error('AI Analysis failed:', aiError);
            dispatch({ type: 'SET_AI_ANALYSIS', payload: null });
            return null;
          });

        // 2. DOM Scanning Promise
        const domScanPromise = scanWebsiteElements(url)
          .then(({ elements }) => {
            dispatch({ type: 'SET_SCANNED_ELEMENTS', payload: elements });
            const elementIssuesData = Array.isArray(elements) ? elements : [];
            dispatch({
              type: 'SET_ELEMENT_ISSUES',
              payload: elementIssuesData,
            });
            return elements;
          })
          .catch((err) => {
            console.error('Element scanning failed:', err);
            dispatch({ type: 'SET_ELEMENT_ISSUES', payload: [] });
            return [];
          });

        aiPromises.push(aiAnalysisPromise, domScanPromise);

        // Wait for both AI analysis and DOM scanning to complete
        try {
          const [aiAnalysis, elements] = await Promise.all(aiPromises);

          // 3. Generate AI fixes after we have all the data
          const allIssues = [
            ...(response?.performance?.issues || []),
            ...(response?.accessibility?.issues || []),
            ...(response?.bestPractices?.issues || []),
            ...(response?.seo?.issues || []),
            ...elements, // Add scanned elements as issues
          ];

          // Only generate AI fixes if we have issues and AI analysis succeeded
          if (allIssues.length > 0) {
            try {
              const aiFixesResponse = await Promise.race([
                fetch('/api/ai-fixes', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ issues: allIssues }),
                }),
                new Promise((_, reject) =>
                  setTimeout(
                    () =>
                      reject(new Error('AI Fixes timeout after 20 seconds')),
                    20000
                  )
                ),
              ]);

              if (aiFixesResponse.ok) {
                const { suggestions } = await aiFixesResponse.json();
                dispatch({ type: 'SET_AI_FIXES', payload: suggestions });
              } else {
                console.warn(
                  'AI Fixes generation failed:',
                  aiFixesResponse.statusText
                );
                dispatch({ type: 'SET_AI_FIXES', payload: null });
              }
            } catch (fixError) {
              console.warn('AI Fixes generation failed:', fixError);
              dispatch({ type: 'SET_AI_FIXES', payload: null });
            }
          }
        } catch (error) {
          console.error('AI processing failed:', error);
        }
      }

      const finalScanStats = {
        pagesScanned:
          response.scanStats?.pagesScanned || scanStats.pagesScanned,
        totalPages: response.scanStats?.totalPages || scanStats.totalPages,
        scannedUrls: response.scanStats?.scannedUrls || scanStats.scannedUrls,
      };

      dispatch({ type: 'SET_SCAN_STATS', payload: finalScanStats });
      navigate(`/analyze/${analysis.id}`);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Analysis failed:', err.message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_AI_LOADING', payload: false });
    }
  };

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
        cachedAiFixes: aiFixes, // Pass the cached AI fixes
      },
    });
  };

  // Function to clear all analysis data
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
