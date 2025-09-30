import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { runLighthouseAnalysis } from '../services/lighthouse';
import { scanWebsiteElements } from '../services/domScanner';
import { getFixSuggestions } from '../services/aiFix';
import { isAIAvailable } from '../config/aiConfig';
import { STORAGE_KEYS, API_CONFIG } from '../constants';

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [scanStats, setScanStats] = useState({
    pagesScanned: 0,
    totalPages: 0,
    scannedUrls: [],
  });
  const [scannedElements, setScannedElements] = useState([]);
  const [elementIssues, setElementIssues] = useState([]);
  const [aiFixes, setAiFixes] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState('');

  const navigate = useNavigate();

  // Helper function to clear all persisted data
  const clearPersistedData = () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  };

  // Load persisted data on component mount
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        // Check if user is coming from a fresh login/signup
        // If they're on the base /analyzer route (not /analyze/:id), clear previous data
        const currentPath = window.location.pathname;
        const isBaseAnalyzerRoute = currentPath === '/analyzer';

        if (isBaseAnalyzerRoute) {
          // User is on the main analyzer page, start fresh
          clearPersistedData();
          return;
        }

        // Only load persisted data if user is on a specific analysis route (/analyze/:id)
        const savedResults = localStorage.getItem(
          STORAGE_KEYS.ANALYSIS_RESULTS
        );
        const savedAiAnalysis = localStorage.getItem(STORAGE_KEYS.AI_ANALYSIS);
        const savedAiFixes = localStorage.getItem(STORAGE_KEYS.AI_FIXES);
        const savedScanStats = localStorage.getItem(STORAGE_KEYS.SCAN_STATS);
        const savedScannedElements = localStorage.getItem(
          STORAGE_KEYS.SCANNED_ELEMENTS
        );
        const savedElementIssues = localStorage.getItem(
          STORAGE_KEYS.ELEMENT_ISSUES
        );
        const savedWebsiteUrl = localStorage.getItem(STORAGE_KEYS.WEBSITE_URL);

        if (savedResults) setResults(JSON.parse(savedResults));
        if (savedAiAnalysis) setAiAnalysis(JSON.parse(savedAiAnalysis));
        if (savedAiFixes) setAiFixes(JSON.parse(savedAiFixes));
        if (savedScanStats) setScanStats(JSON.parse(savedScanStats));
        if (savedScannedElements)
          setScannedElements(JSON.parse(savedScannedElements));
        if (savedElementIssues)
          setElementIssues(JSON.parse(savedElementIssues));
        if (savedWebsiteUrl) setWebsiteUrl(savedWebsiteUrl);
      } catch (error) {
        console.error('Error loading persisted data:', error);
        // Clear corrupted data
        clearPersistedData();
      }
    };

    loadPersistedData();
  }, []);

  // Helper function to persist data
  const persistData = (key, data) => {
    try {
      if (data !== null && data !== undefined) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Error persisting ${key}:`, error);
    }
  };

  const runAnalysis = async (url) => {
    setLoading(true);
    setError(null);

    // Clear previous data
    setResults(null);
    setAiAnalysis(null);
    setAiFixes(null);
    setScanStats({ pagesScanned: 0, totalPages: 0, scannedUrls: [] });
    setWebsiteUrl(url);

    // Clear persisted data for new analysis
    clearPersistedData();

    // Persist the new website URL
    localStorage.setItem(STORAGE_KEYS.WEBSITE_URL, url);

    try {
      const analysis = { id: Date.now().toString() };

      // Run Lighthouse analysis
      const response = await runLighthouseAnalysis(url, (progress) => {
        setScanStats(progress);
        persistData(STORAGE_KEYS.SCAN_STATS, progress);
      });

      const analysisResults = {
        performance: response.performance,
        accessibility: response.accessibility,
        bestPractices: response.bestPractices,
        seo: response.seo,
      };

      setResults(analysisResults);
      persistData(STORAGE_KEYS.ANALYSIS_RESULTS, analysisResults);

      // Generate AI analysis using backend endpoint
      const hasAI = isAIAvailable();
      if (hasAI) {
        setAiLoading(true);
        try {
          const aiResponse = await fetch('/api/ai-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ results: response }),
          });

          if (aiResponse.ok) {
            const { analysis } = await aiResponse.json();
            setAiAnalysis(analysis);
            persistData(STORAGE_KEYS.AI_ANALYSIS, analysis);
          } else {
            console.error('AI Analysis failed:', aiResponse.statusText);
            setAiAnalysis(null);
          }
        } catch (aiError) {
          console.error('AI Analysis failed:', aiError);
          // Don't fail the entire analysis if AI fails
          setAiAnalysis(null);
        }
      }

      // Scan elements and generate AI fixes if AI is available
      if (hasAI) {
        try {
          const { elements } = await scanWebsiteElements(url);
          setScannedElements(elements);
          persistData(STORAGE_KEYS.SCANNED_ELEMENTS, elements);

          // Get all issues for AI fixes
          const allIssues = [
            ...(response?.performance?.issues || []),
            ...(response?.accessibility?.issues || []),
            ...(response?.bestPractices?.issues || []),
            ...(response?.seo?.issues || []),
            ...elements, // Add scanned elements as issues
          ];

          // Generate AI fixes for all issues during analysis
          if (allIssues.length > 0) {
            const aiFixesResponse = await fetch('/api/ai-fixes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ issues: allIssues }),
            });

            if (aiFixesResponse.ok) {
              const { suggestions } = await aiFixesResponse.json();
              setAiFixes(suggestions);
              persistData(STORAGE_KEYS.AI_FIXES, suggestions);
            }
          }

          const elementIssuesData = Array.isArray(elements) ? elements : [];
          setElementIssues(elementIssuesData);
          persistData(STORAGE_KEYS.ELEMENT_ISSUES, elementIssuesData);
        } catch (err) {
          console.error('Element scanning failed:', err);
          setElementIssues([]);
          setAiFixes(null);
        }
      }

      const finalScanStats = {
        pagesScanned:
          response.scanStats?.pagesScanned || scanStats.pagesScanned,
        totalPages: response.scanStats?.totalPages || scanStats.totalPages,
        scannedUrls: response.scanStats?.scannedUrls || scanStats.scannedUrls,
      };

      setScanStats(finalScanStats);
      persistData(STORAGE_KEYS.SCAN_STATS, finalScanStats);
      navigate(`/analyze/${analysis.id}`);
    } catch (err) {
      setError(err.message);
      console.error('Analysis failed:', err.message);
    } finally {
      setLoading(false);
      setAiLoading(false);
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
    setResults(null);
    setAiAnalysis(null);
    setAiFixes(null);
    setScanStats({ pagesScanned: 0, totalPages: 0, scannedUrls: [] });
    setScannedElements([]);
    setElementIssues([]);
    setWebsiteUrl('');
    setError(null);
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
