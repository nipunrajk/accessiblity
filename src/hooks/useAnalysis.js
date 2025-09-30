import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runLighthouseAnalysis } from '../services/lighthouse';
import { scanWebsiteElements } from '../services/domScanner';
import { getFixSuggestions } from '../services/aiFix';

import { isAIAvailable } from '../config/aiConfig';

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

  const navigate = useNavigate();

  const runAnalysis = async (websiteUrl) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setAiAnalysis(null);
    setAiFixes(null);
    setScanStats({ pagesScanned: 0, totalPages: 0, scannedUrls: [] });

    try {
      const analysis = { id: Date.now().toString() };

      // Run Lighthouse analysis
      const response = await runLighthouseAnalysis(websiteUrl, (progress) => {
        setScanStats(progress);
      });

      setResults({
        performance: response.performance,
        accessibility: response.accessibility,
        bestPractices: response.bestPractices,
        seo: response.seo,
      });

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
          const { elements } = await scanWebsiteElements(websiteUrl);
          setScannedElements(elements);

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
            }
          }

          setElementIssues(Array.isArray(elements) ? elements : []);
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
      navigate(`/analyze/${analysis.id}`);
    } catch (err) {
      setError(err.message);
      console.error('Analysis failed:', err.message);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const navigateToAiFix = (websiteUrl) => {
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
        websiteUrl,
        scanStats,
        scannedElements,
        cachedAiFixes: aiFixes, // Pass the cached AI fixes
      },
    });
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
    runAnalysis,
    navigateToAiFix,
  };
};
