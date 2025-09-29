import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { runLighthouseAnalysis } from '../services/lighthouse';
import { getAIAnalysis, getIssueRecommendations } from '../services/langchain';
import { supabase } from '../lib/supabase';
import { scanWebsiteElements } from '../services/domScanner';
import { getFixSuggestions } from '../services/aiFix';
import AIProviderSettings from '../components/AIProviderSettings';

function Analyzer() {
  const [websiteUrl, setWebsiteUrl] = useState('');
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
  const [analysisId, setAnalysisId] = useState(null);
  const [scannedElements, setScannedElements] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [elementIssues, setElementIssues] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      loadAnalysis(id);
    }
  }, [id]);

  useEffect(() => {
    const scanElements = async () => {
      if (!websiteUrl) return;

      try {
        setIsScanning(true);
        const { elements } = await scanWebsiteElements(websiteUrl);
        setScannedElements(elements);

        // Get fix suggestions for the elements
        const suggestions = await getFixSuggestions(elements);
        setElementIssues(Array.isArray(suggestions) ? suggestions : []);
      } catch (err) {
        setError('Failed to scan elements: ' + err.message);
        setElementIssues([]); // Reset to empty array on error
      } finally {
        setIsScanning(false);
      }
    };

    if (results) {
      scanElements();
    }
  }, [results, websiteUrl]);

  const loadAnalysis = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('website_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setWebsiteUrl(data.website_url);
        setResults({
          performance: data.lighthouse_results.performance,
          accessibility: data.lighthouse_results.accessibility,
          bestPractices: data.lighthouse_results.bestPractices,
          seo: data.lighthouse_results.seo,
        });
        setAiAnalysis(data.ai_analysis);
        setScanStats(data.scan_stats);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getImpactLabel = (impact, type) => {
    const impactNum = parseFloat(impact);
    const thresholds = {
      performance: {
        critical: 25,
        high: 15,
        medium: 8,
      },
      accessibility: {
        critical: 15,
        high: 10,
        medium: 5,
      },
      'best-practices': {
        critical: 20,
        high: 12,
        medium: 6,
      },
      seo: {
        critical: 18,
        high: 10,
        medium: 5,
      },
    };

    const categoryThresholds = thresholds[type] || thresholds.performance;
    if (impactNum >= categoryThresholds.critical) return 'Critical';
    if (impactNum >= categoryThresholds.high) return 'High';
    if (impactNum >= categoryThresholds.medium) return 'Medium';
    return 'Low';
  };

  const getScoreColor = (score) => {
    if (typeof score !== 'number' || isNaN(score)) return '#ef4444';
    return score >= 90 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setAiAnalysis(null);
    setScanStats({ pagesScanned: 0, totalPages: 0, scannedUrls: [] });

    try {
      // Temporarily skip Supabase for testing
      const analysis = { id: Date.now().toString() };
      setAnalysisId(analysis.id);

      const response = await runLighthouseAnalysis(websiteUrl, (progress) => {
        setScanStats(progress);
      });

      setResults({
        performance: response.performance,
        accessibility: response.accessibility,
        bestPractices: response.bestPractices,
        seo: response.seo,
      });

      setAiLoading(true);
      const aiAnalysisResult = await getAIAnalysis(response);
      setAiAnalysis(aiAnalysisResult);

      const finalScanStats = {
        pagesScanned:
          response.scanStats?.pagesScanned || scanStats.pagesScanned,
        totalPages: response.scanStats?.totalPages || scanStats.totalPages,
        scannedUrls: response.scanStats?.scannedUrls || scanStats.scannedUrls,
      };

      // Temporarily skip Supabase update for testing
      console.log('Analysis completed:', {
        performance: response.performance.score,
        accessibility: response.accessibility.score,
        bestPractices: response.bestPractices.score,
        seo: response.seo.score,
      });

      setScanStats(finalScanStats);

      navigate(`/analyze/${analysis.id}`);
    } catch (err) {
      setError(err.message);
      // Temporarily skip Supabase error update
      console.error('Analysis failed:', err.message);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const handleNavigateToAiFix = () => {
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

  const ScoreCard = ({ label, data }) => {
    if (!data) return null;

    const renderMetricItem = (title, value, score) => {
      const displayValue =
        typeof value === 'object' ? value.displayValue || value.value : value;
      const displayScore = typeof value === 'object' ? value.score || 0 : score;

      return (
        <div key={title} className='flex items-center justify-between py-2'>
          <span className='text-sm text-gray-600'>{title}</span>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-gray-900'>
              {typeof displayValue === 'number'
                ? Math.round(displayValue) + 'ms'
                : displayValue}
            </span>
            <div
              className='w-2 h-2 rounded-full'
              style={{ backgroundColor: getScoreColor(displayScore) }}
            ></div>
          </div>
        </div>
      );
    };

    const renderPerformanceMetrics = () => {
      if (label !== 'Performance' || !data.metrics) return null;

      return (
        <div className='space-y-1'>
          {data.metrics.fcp &&
            renderMetricItem('First Contentful Paint', data.metrics.fcp)}
          {data.metrics.lcp &&
            renderMetricItem('Largest Contentful Paint', data.metrics.lcp)}
          {data.metrics.tbt &&
            renderMetricItem('Total Blocking Time', data.metrics.tbt)}
          {data.metrics.cls &&
            renderMetricItem('Cumulative Layout Shift', data.metrics.cls)}
          {data.metrics.si && renderMetricItem('Speed Index', data.metrics.si)}
          {data.metrics.tti &&
            renderMetricItem('Time to Interactive', data.metrics.tti)}
        </div>
      );
    };

    const renderAccessibilityMetrics = () => {
      if (label !== 'Accessibility' || !data.issues) return null;

      const findIssue = (keywords) => {
        return data.issues.find((i) =>
          keywords.some((keyword) => i.title.toLowerCase().includes(keyword))
        );
      };

      const metrics = {
        colorContrast: findIssue(['contrast', 'color']),
        headings: findIssue(['heading', 'h1', 'h2', 'h3', 'header']),
        aria: findIssue(['aria', 'accessible name', 'role']),
        imageAlts: findIssue(['image', 'alt', 'img']),
        linkNames: findIssue(['link', 'anchor', 'href']),
      };

      return (
        <div className='mt-4 border rounded-lg overflow-hidden bg-gray-50'>
          {Object.entries(metrics).map(([key, issue]) => {
            const title = {
              colorContrast: 'Color Contrast',
              headings: 'Headings',
              aria: 'ARIA',
              imageAlts: 'Image Alts',
              linkNames: 'Link Names',
            }[key];

            return renderMetricItem(
              title,
              issue ? `${issue.items?.length || 0} issues` : 'Pass',
              issue ? issue.score : 100
            );
          })}
        </div>
      );
    };

    const renderSEOMetrics = () => {
      if (label !== 'SEO' || !data.issues) return null;

      const findIssue = (keywords) => {
        return data.issues.find((i) =>
          keywords.some((keyword) => i.title.toLowerCase().includes(keyword))
        );
      };

      const metrics = {
        metaDescription: findIssue(['meta description', 'meta']),
        titleTags: findIssue(['title tag', 'title element']),
        headingStructure: findIssue([
          'heading',
          'h1',
          'h2',
          'h3',
          'header structure',
        ]),
        mobileOptimization: findIssue(['mobile', 'viewport', 'responsive']),
        urlStructure: findIssue(['url', 'slug', 'permalink']),
      };

      return (
        <div className='mt-4 border rounded-lg overflow-hidden bg-gray-50'>
          {Object.entries(metrics).map(([key, issue]) => {
            const title = {
              metaDescription: 'Meta Description',
              titleTags: 'Title Tags',
              headingStructure: 'Heading Structure',
              mobileOptimization: 'Mobile Optimization',
              urlStructure: 'URL Structure',
            }[key];

            return renderMetricItem(
              title,
              issue ? `${issue.items?.length || 0} issues` : 'Pass',
              issue ? issue.score : 100
            );
          })}
        </div>
      );
    };

    const renderBestPracticesMetrics = () => {
      if (label !== 'Best Practices' || !data.issues) return null;

      const findIssue = (keywords) => {
        return data.issues.find((i) =>
          keywords.some((keyword) => i.title.toLowerCase().includes(keyword))
        );
      };

      const metrics = {
        https: findIssue(['https', 'ssl', 'secure']),
        doctype: findIssue(['doctype', 'html5', 'document type']),
        javascriptErrors: findIssue(['javascript', 'error', 'console']),
        mobileFriendly: findIssue(['mobile', 'viewport', 'responsive']),
        browserCompatibility: findIssue([
          'browser',
          'compatibility',
          'support',
        ]),
      };

      return (
        <div className='mt-4 border rounded-lg overflow-hidden bg-gray-50'>
          {Object.entries(metrics).map(([key, issue]) => {
            const title = {
              https: 'HTTPS Usage',
              doctype: 'Valid Doctype',
              javascriptErrors: 'No JavaScript Errors',
              mobileFriendly: 'Mobile Friendly',
              browserCompatibility: 'Browser Compatibility',
            }[key];

            const symbol = !issue ? '✓' : '✗';
            const symbolColor = !issue ? 'text-green-600' : 'text-red-600';

            return (
              <div
                key={key}
                className='flex items-center justify-between p-2 border-b border-gray-100 last:border-0'
              >
                <span className='text-sm font-medium text-gray-600'>
                  {title}
                </span>
                <div className='flex items-center'>
                  <span className={`text-2xl font-bold ${symbolColor}`}>
                    {symbol}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    const renderAuditDetails = () => {
      if (!data.details) return null;

      return (
        <div className='mt-4 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-green-600'>
              {data.details.passed}
            </p>
            <p className='text-xs text-gray-600 font-medium'>Passed</p>
          </div>
          <div className='h-8 w-px bg-gray-300'></div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-red-600'>
              {data.details.failed}
            </p>
            <p className='text-xs text-gray-600 font-medium'>Failed</p>
          </div>
          <div className='h-8 w-px bg-gray-300'></div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-700'>
              {data.details.total}
            </p>
            <p className='text-xs text-gray-600 font-medium'>Total</p>
          </div>
        </div>
      );
    };

    return (
      <div className='bg-white border border-gray-200 rounded-2xl p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold text-gray-900'>{label}</h3>
          <div className='text-right'>
            <div className='text-2xl font-bold text-gray-900'>
              {Math.round(data.score)}%
            </div>
            <div className='text-sm text-gray-500'>Score</div>
          </div>
        </div>

        <div className='space-y-4'>
          {label === 'Performance' && renderPerformanceMetrics()}
          {label === 'Accessibility' && renderAccessibilityMetrics()}
          {label === 'SEO' && renderSEOMetrics()}
          {label === 'Best Practices' && renderBestPracticesMetrics()}
        </div>
      </div>
    );
  };

  const IssueReport = ({ results }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [validationResults, setValidationResults] = useState({});

    const allIssues = [
      ...(results.performance?.issues || []),
      ...(results.accessibility?.issues || []),
      ...(results.bestPractices?.issues || []),
      ...(results.seo?.issues || []),
    ].sort((a, b) => parseFloat(b.impact) - parseFloat(a.impact));

    const filteredIssues =
      selectedCategory === 'all'
        ? allIssues
        : allIssues.filter((issue) => issue.type === selectedCategory);

    const getTypeColor = (type) => {
      switch (type) {
        case 'performance':
          return 'text-blue-600';
        case 'accessibility':
          return 'text-green-600';
        case 'best-practices':
          return 'text-purple-600';
        case 'seo':
          return 'text-orange-600';
        default:
          return 'text-gray-600';
      }
    };

    const getImpactColor = (impact, type) => {
      const label = getImpactLabel(impact, type);
      switch (label) {
        case 'Critical':
          return 'bg-red-100 text-red-800';
        case 'High':
          return 'bg-orange-100 text-orange-800';
        case 'Medium':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-green-100 text-green-800';
      }
    };

    return (
      <div className='bg-white border border-gray-200 rounded-2xl p-8'>
        <div className='flex items-center justify-between mb-8'>
          <h2 className='text-2xl font-bold text-gray-900'>Issues Found</h2>
          <span className='text-sm text-gray-500'>
            {filteredIssues.length} issues
          </span>
        </div>

        <div className='flex flex-wrap gap-2 mb-8'>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({allIssues.length})
          </button>
          {['performance', 'accessibility', 'best-practices', 'seo'].map(
            (type) => {
              const count = allIssues.filter(
                (issue) => issue.type === type
              ).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedCategory(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === type
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </button>
              );
            }
          )}
        </div>

        <div className='space-y-4'>
          {filteredIssues.length === 0 ? (
            <div className='text-center py-12'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No Issues Found
              </h3>
              <p className='text-gray-600'>
                Great! No issues were found in this category.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue, index) => (
              <div
                key={index}
                className='border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          issue.type === 'performance'
                            ? 'bg-blue-100 text-blue-700'
                            : issue.type === 'accessibility'
                            ? 'bg-green-100 text-green-700'
                            : issue.type === 'best-practices'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {issue.type.charAt(0).toUpperCase() +
                          issue.type.slice(1)}
                      </span>
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {issue.title}
                    </h3>
                    <p className='text-gray-600 leading-relaxed'>
                      {issue.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='border-b border-gray-100'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>FF</span>
              </div>
              <span className='font-semibold text-gray-900'>FastFix</span>
            </div>
            <div className='flex items-center gap-4'>
              <AIProviderSettings />
              <button
                onClick={() => navigate('/github-config')}
                className='p-2 text-gray-600 hover:text-gray-900 transition-colors'
                title='GitHub Integration'
              >
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-6 py-12'>
        {/* Hero Section */}
        {!results && (
          <div className='text-center mb-16'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              Website Performance Analysis
            </h1>
            <p className='text-xl text-gray-600 mb-12 max-w-2xl mx-auto'>
              Get AI-powered insights to optimize your website's performance,
              accessibility, and SEO
            </p>

            <form onSubmit={handleSubmit} className='max-w-2xl mx-auto'>
              <div className='flex gap-3'>
                <input
                  type='url'
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder='https://example.com'
                  required
                  className='flex-1 px-6 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white'
                />
                <button
                  type='submit'
                  disabled={loading}
                  className='px-8 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                >
                  {loading ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                      Analyzing
                    </>
                  ) : (
                    <>
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 10V3L4 14h7v7l9-11h-7z'
                        />
                      </svg>
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className='max-w-2xl mx-auto'>
            <div className='bg-white border border-gray-200 rounded-2xl p-8 text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4'></div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Analyzing Website
              </h3>
              <p className='text-gray-600 mb-4'>
                Scanning {scanStats.pagesScanned} of{' '}
                {scanStats.totalPages || '?'} pages
              </p>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-black h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${
                      scanStats.totalPages
                        ? (scanStats.pagesScanned / scanStats.totalPages) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='max-w-2xl mx-auto'>
            <div className='bg-red-50 border border-red-200 rounded-2xl p-6'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-4 h-4 text-red-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <p className='text-red-800 font-medium'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className='space-y-8'>
            {/* Header with URL */}
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Analysis Complete
              </h2>
              <p className='text-gray-600'>{websiteUrl}</p>
            </div>

            {/* Score Overview */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              <div className='text-center'>
                <div className='relative w-20 h-20 mx-auto mb-3'>
                  <svg
                    className='w-20 h-20 transform -rotate-90'
                    viewBox='0 0 36 36'
                  >
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke='#f3f4f6'
                      strokeWidth='2'
                    />
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke={getScoreColor(results.performance.score)}
                      strokeWidth='2'
                      strokeDasharray={`${results.performance.score}, 100`}
                    />
                  </svg>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-lg font-bold text-gray-900'>
                      {Math.round(results.performance.score)}
                    </span>
                  </div>
                </div>
                <h3 className='font-semibold text-gray-900'>Performance</h3>
                <p className='text-sm text-gray-600'>Speed & Optimization</p>
              </div>

              <div className='text-center'>
                <div className='relative w-20 h-20 mx-auto mb-3'>
                  <svg
                    className='w-20 h-20 transform -rotate-90'
                    viewBox='0 0 36 36'
                  >
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke='#f3f4f6'
                      strokeWidth='2'
                    />
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke={getScoreColor(results.accessibility.score)}
                      strokeWidth='2'
                      strokeDasharray={`${results.accessibility.score}, 100`}
                    />
                  </svg>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-lg font-bold text-gray-900'>
                      {Math.round(results.accessibility.score)}
                    </span>
                  </div>
                </div>
                <h3 className='font-semibold text-gray-900'>Accessibility</h3>
                <p className='text-sm text-gray-600'>Inclusive Design</p>
              </div>

              <div className='text-center'>
                <div className='relative w-20 h-20 mx-auto mb-3'>
                  <svg
                    className='w-20 h-20 transform -rotate-90'
                    viewBox='0 0 36 36'
                  >
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke='#f3f4f6'
                      strokeWidth='2'
                    />
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke={getScoreColor(results.bestPractices.score)}
                      strokeWidth='2'
                      strokeDasharray={`${results.bestPractices.score}, 100`}
                    />
                  </svg>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-lg font-bold text-gray-900'>
                      {Math.round(results.bestPractices.score)}
                    </span>
                  </div>
                </div>
                <h3 className='font-semibold text-gray-900'>Best Practices</h3>
                <p className='text-sm text-gray-600'>Code Quality</p>
              </div>

              <div className='text-center'>
                <div className='relative w-20 h-20 mx-auto mb-3'>
                  <svg
                    className='w-20 h-20 transform -rotate-90'
                    viewBox='0 0 36 36'
                  >
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke='#f3f4f6'
                      strokeWidth='2'
                    />
                    <path
                      d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      fill='none'
                      stroke={getScoreColor(results.seo.score)}
                      strokeWidth='2'
                      strokeDasharray={`${results.seo.score}, 100`}
                    />
                  </svg>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-lg font-bold text-gray-900'>
                      {Math.round(results.seo.score)}
                    </span>
                  </div>
                </div>
                <h3 className='font-semibold text-gray-900'>SEO</h3>
                <p className='text-sm text-gray-600'>Search Optimization</p>
              </div>
            </div>

            {/* AI Insights */}
            {aiLoading ? (
              <div className='bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4'></div>
                <p className='text-gray-600'>Generating AI insights...</p>
              </div>
            ) : (
              aiAnalysis && (
                <div className='bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8'>
                  <div className='flex items-center gap-3 mb-6'>
                    <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 text-white'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 10V3L4 14h7v7l9-11h-7z'
                        />
                      </svg>
                    </div>
                    <h3 className='text-xl font-bold text-gray-900'>
                      AI Insights
                    </h3>
                  </div>
                  <div className='prose prose-gray max-w-none'>
                    <pre className='whitespace-pre-wrap text-gray-700 leading-relaxed'>
                      {aiAnalysis}
                    </pre>
                  </div>
                </div>
              )
            )}

            {/* Action Button */}
            <div className='text-center'>
              <button
                onClick={handleNavigateToAiFix}
                className='inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
                Get AI Fixes
              </button>
            </div>

            {/* Detailed Metrics */}
            <div className='grid md:grid-cols-2 gap-8'>
              <ScoreCard label='Performance' data={results.performance} />
              <ScoreCard label='Accessibility' data={results.accessibility} />
              <ScoreCard label='Best Practices' data={results.bestPractices} />
              <ScoreCard label='SEO' data={results.seo} />
            </div>

            <IssueReport results={results} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Analyzer;
