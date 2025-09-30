import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runLighthouseAnalysis } from '../services/lighthouse';
import { getAIAnalysis } from '../services/langchain';
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

  const navigate = useNavigate();

  const runAnalysis = async (websiteUrl) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setAiAnalysis(null);
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

      // Generate AI analysis only if AI is available
      const hasAI = isAIAvailable();
      if (hasAI) {
        setAiLoading(true);
        try {
          const aiAnalysisResult = await getAIAnalysis(response);
          setAiAnalysis(aiAnalysisResult);
        } catch (aiError) {
          console.error('AI Analysis failed:', aiError);
          // Don't fail the entire analysis if AI fails
          setAiAnalysis(null);
        }
      }

      // Scan elements only if AI is available
      if (hasAI) {
        try {
          const { elements } = await scanWebsiteElements(websiteUrl);
          setScannedElements(elements);
          const suggestions = await getFixSuggestions(elements);
          setElementIssues(Array.isArray(suggestions) ? suggestions : []);
        } catch (err) {
          console.error('Element scanning failed:', err);
          setElementIssues([]);
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
    runAnalysis,
    navigateToAiFix,
  };
};
