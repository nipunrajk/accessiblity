import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getFixSuggestions } from '../services/aiFix';
import { isAIAvailable } from '../config/aiConfig';
import { STORAGE_KEYS } from '../constants';
import jsPDF from 'jspdf';
import IssueScreenshot from '../components/IssueScreenshot';
import BeforeAfterComparison from '../components/BeforeAfterComparison';
import logger from '../utils/logger';

function AIFix() {
  const location = useLocation();
  const navigate = useNavigate();
  // Get data from location.state or fallback to localStorage
  const getInitialData = () => {
    if (location.state) {
      return location.state;
    }

    // Fallback to localStorage if no state passed
    try {
      const savedResults = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULTS);
      const savedAiFixes = localStorage.getItem(STORAGE_KEYS.AI_FIXES);
      const savedScanStats = localStorage.getItem(STORAGE_KEYS.SCAN_STATS);
      const savedScannedElements = localStorage.getItem(
        STORAGE_KEYS.SCANNED_ELEMENTS
      );
      const savedElementIssues = localStorage.getItem(
        STORAGE_KEYS.ELEMENT_ISSUES
      );
      const savedWebsiteUrl = localStorage.getItem(STORAGE_KEYS.WEBSITE_URL);

      const allIssues = [];

      if (savedResults) {
        const results = JSON.parse(savedResults);
        allIssues.push(...(results?.performance?.issues || []));
        allIssues.push(...(results?.accessibility?.issues || []));
        allIssues.push(...(results?.bestPractices?.issues || []));
        allIssues.push(...(results?.seo?.issues || []));
      }

      if (savedElementIssues) {
        const elementIssues = JSON.parse(savedElementIssues);
        if (Array.isArray(elementIssues)) {
          allIssues.push(...elementIssues);
        }
      }

      return {
        issues: allIssues,
        websiteUrl: savedWebsiteUrl || '',
        scanStats: savedScanStats
          ? JSON.parse(savedScanStats)
          : { pagesScanned: 0, totalPages: 0, scannedUrls: [] },
        scannedElements: savedScannedElements
          ? JSON.parse(savedScannedElements)
          : [],
        cachedAiFixes: savedAiFixes ? JSON.parse(savedAiFixes) : null,
      };
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return {
        issues: [],
        websiteUrl: '',
        scanStats: { pagesScanned: 0, totalPages: 0, scannedUrls: [] },
        scannedElements: [],
        cachedAiFixes: null,
      };
    }
  };

  const { issues, websiteUrl, scanStats, scannedElements, cachedAiFixes } =
    getInitialData();

  const hasAIAvailable = isAIAvailable();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fixSuggestions, setFixSuggestions] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [githubDetails, setGithubDetails] = useState({
    token: '',
    owner: '',
    repo: '',
  });
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [screenshotStates, setScreenshotStates] = useState({});
  const [comparisonStates, setComparisonStates] = useState({});

  // Step 1: Use cached AI fixes (no duplicate API calls)
  useEffect(() => {
    if (!hasAIAvailable) {
      return; // Skip AI suggestions if not available
    }

    // Use cached AI fixes if available
    if (cachedAiFixes) {
      logger.success('Using cached AI fixes', {
        issueCount: Object.keys(cachedAiFixes).length,
      });
      setFixSuggestions(cachedAiFixes);
      setSuccessMessage('Using cached AI analysis results');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      logger.debug('No cached AI fixes available');
    }
  }, [hasAIAvailable, cachedAiFixes]);

  // Manual regenerate function
  const handleRegenerateFixes = async () => {
    if (!hasAIAvailable) {
      setError('AI is not configured. Please check your AI settings.');
      return;
    }

    try {
      setError(null);
      setLoadingStates((prev) => ({ ...prev, suggestions: true }));
      logger.info('Regenerating AI fixes', { issueCount: issues.length });
      const suggestions = await getFixSuggestions(issues);
      setFixSuggestions(suggestions);
      setSuccessMessage('Generated fresh AI recommendations');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      logger.error('Failed to regenerate AI fixes', err);
      setError(err.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, suggestions: false }));
    }
  };

  // Group issues by DOM element
  const groupedIssues = issues.reduce((acc, issue) => {
    const selectors = [];
    if (issue.selector) selectors.push(issue.selector);
    if (issue.recommendations) {
      issue.recommendations.forEach((rec) => {
        if (rec.selector && !selectors.includes(rec.selector)) {
          selectors.push(rec.selector);
        }
      });
    }

    selectors.forEach((selector) => {
      if (!acc[selector]) {
        acc[selector] = [];
      }
      acc[selector].push(issue);
    });
    return acc;
  }, {});

  const getTypeColor = (type) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accessibility':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'best-practices':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'seo':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Add title
    doc.setFontSize(16);
    doc.text('Website Analysis Report', 20, yPos);
    yPos += 20;

    // Add scan statistics
    doc.setFontSize(12);
    doc.text(`Website URL: ${websiteUrl}`, 20, yPos);
    yPos += 10;
    doc.text(`Pages Scanned: ${scanStats.pagesScanned}`, 20, yPos);
    yPos += 10;
    doc.text(`Total Issues Found: ${issues.length}`, 20, yPos);
    yPos += 20;

    // Add issues and fixes
    doc.setFontSize(14);
    doc.text('Issues and AI Fixes:', 20, yPos);
    yPos += 10;

    issues.forEach((issue, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      // Use title or description if available, fallback to a default message
      const issueTitle =
        issue.title || issue.description || 'Issue details not available';
      doc.text(`${index + 1}. Issue: ${issueTitle}`, 20, yPos);
      yPos += 10;

      // Add issue type and impact if available
      if (issue.type || issue.impact) {
        doc.setFontSize(10);
        const typeText = issue.type ? `Type: ${issue.type}` : '';
        const impactText = issue.impact
          ? `Impact: ${Math.round(issue.impact)}%`
          : '';
        const infoText = [typeText, impactText].filter(Boolean).join(' | ');
        if (infoText) {
          doc.text(infoText, 30, yPos);
          yPos += 10;
        }
      }

      // Add fix suggestions
      if (fixSuggestions[issue.title]) {
        const suggestion = fixSuggestions[issue.title];
        doc.setFontSize(10);
        const suggestionText =
          typeof suggestion === 'string'
            ? suggestion
            : Array.isArray(suggestion)
            ? suggestion[0]?.description || 'Fix suggestion available'
            : suggestion.description || 'Fix suggestion available';
        doc.text(`AI Fix Suggestion: ${suggestionText}`, 30, yPos);
        yPos += 10;
      }

      // Add some spacing between issues
      yPos += 5;
    });

    // Save the PDF
    doc.save('website-analysis-report.pdf');
  };

  const handleApplyFix = (suggestion) => {
    setCurrentSuggestion(suggestion);
    setShowModal(true);
  };

  const handleSubmitGithubDetails = async () => {
    if (!currentSuggestion) {
      setError('No suggestion selected');
      return;
    }

    try {
      setLoadingStates((prev) => ({ ...prev, submitting: true }));

      // Find the current issue and get all its suggestions
      const currentIssue = issues.find((issue) =>
        fixSuggestions[issue.title]?.includes(currentSuggestion)
      );
      const allSuggestionsForIssue = currentIssue
        ? fixSuggestions[currentIssue.title]
        : [];

      // Get all descriptions from the suggestions and join them with commas
      const suggestionsString = allSuggestionsForIssue
        .map((sug) => sug.description)
        .join(', ');

      const response = await fetch('/api/repo/ai-optimize-specific', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubToken: githubDetails.token,
          owner: githubDetails.owner,
          repo: githubDetails.repo,
          suggestion: suggestionsString,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply fix');
      }

      const data = await response.json();
      setSuccessMessage('Fix applied successfully!');

      // Open URLs in new tabs if available
      if (data.success && data.data.pullRequest) {
        const { url } = data.data.pullRequest;

        // Open PR URL
        if (url) {
          window.open(url, '_blank').focus();
        }
      }

      setShowModal(false);
      setCurrentSuggestion(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Add this function near your other utility functions
  const getUniqueIssues = (issues) => {
    const uniqueIssues = new Map();

    issues.forEach((issue) => {
      const key = `${issue.type}-${issue.title}`; // Create unique key using type and title
      if (!uniqueIssues.has(key)) {
        uniqueIssues.set(key, issue);
      }
    });

    return Array.from(uniqueIssues.values());
  };

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header with back button */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/analyzer')}
              className='p-2 rounded-lg'
            >
              <svg
                className='w-6 h-6 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-800 text-left'>
                {hasAIAvailable ? 'AI-Powered Fixes' : 'Issue Analysis'}
              </h1>
              <p className='text-gray-600 text-left'>
                {hasAIAvailable
                  ? `AI analysis and fixes for ${websiteUrl || 'website'}`
                  : `Manual review required for ${websiteUrl || 'website'}`}
              </p>
              {cachedAiFixes && (
                <p className='text-sm text-green-600 mt-1'>
                  ✅ Using cached analysis results
                </p>
              )}
            </div>
          </div>

          <div className='flex gap-4'>
            {hasAIAvailable && (
              <button
                onClick={handleRegenerateFixes}
                disabled={loadingStates.suggestions}
                className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2'
              >
                {loadingStates.suggestions ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Regenerate Fixes
                  </>
                )}
              </button>
            )}
            <button
              onClick={generatePDF}
              className='bg-black text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center gap-2'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
              Download Report
            </button>
          </div>
        </div>

        {/* GitHub Details Modal */}
        {showModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
            <div className='bg-white p-6 rounded-lg w-96'>
              <h2 className='text-xl font-bold mb-4'>
                GitHub Repository Details
              </h2>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    GitHub Token
                  </label>
                  <input
                    type='password'
                    value={githubDetails.token}
                    onChange={(e) =>
                      setGithubDetails({
                        ...githubDetails,
                        token: e.target.value,
                      })
                    }
                    className='w-full p-2 border rounded'
                    placeholder='Enter GitHub token'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Repository Owner
                  </label>
                  <input
                    type='text'
                    value={githubDetails.owner}
                    onChange={(e) =>
                      setGithubDetails({
                        ...githubDetails,
                        owner: e.target.value,
                      })
                    }
                    className='w-full p-2 border rounded'
                    placeholder='Enter repository owner'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Repository Name
                  </label>
                  <input
                    type='text'
                    value={githubDetails.repo}
                    onChange={(e) =>
                      setGithubDetails({
                        ...githubDetails,
                        repo: e.target.value,
                      })
                    }
                    className='w-full p-2 border rounded'
                    placeholder='Enter repository name'
                  />
                </div>
                <div className='flex justify-end gap-4 mt-6'>
                  <button
                    onClick={() => setShowModal(false)}
                    className='px-4 py-2 text-gray-600 hover:text-gray-800'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitGithubDetails}
                    className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2'
                    disabled={loadingStates.submitting}
                  >
                    {loadingStates.submitting ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        Applying Fix...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className='mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded'>
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className='mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded'>
            <p className='text-green-700'>{successMessage}</p>
          </div>
        )}

        {loadingStates.suggestions && (
          <div className='mb-6 bg-blue-50 p-4 rounded-lg flex items-center gap-3'>
            <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
            <p className='text-blue-600'>
              Analyzing issues and generating fix suggestions...
            </p>
          </div>
        )}

        {hasAIAvailable &&
          !cachedAiFixes &&
          !loadingStates.suggestions &&
          Object.keys(fixSuggestions).length === 0 && (
            <div className='mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded'>
              <div className='flex items-center gap-3'>
                <svg
                  className='w-5 h-5 text-yellow-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
                <div>
                  <p className='text-yellow-700 font-medium'>
                    No AI fixes available yet
                  </p>
                  <p className='text-yellow-600 text-sm'>
                    Click "Regenerate Fixes" to generate AI-powered suggestions
                    for these issues.
                  </p>
                </div>
              </div>
            </div>
          )}

        <div className='grid grid-cols-12 gap-6'>
          {/* Sidebar */}
          <div className='col-span-12 lg:col-span-3 space-y-6'>
            {/* Scan Stats */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-800 mb-4'>
                Scan Statistics
              </h2>
              <div className='space-y-3'>
                <div>
                  <span className='text-gray-600'>Pages Scanned:</span>
                  <span className='text-black font-medium ml-2'>
                    {scanStats?.pagesScanned || 0}
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>Elements with Issues:</span>
                  <span className='text-black font-medium ml-2'>
                    {Object.keys(groupedIssues).length}
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>Total Issues:</span>
                  <span className='text-black font-medium ml-2'>
                    {issues.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-800 mb-4'>
                Filter by Category
              </h2>
              <div className='space-y-2'>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left focus:outline-none ${
                    selectedCategory === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {['performance', 'accessibility', 'seo'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedCategory(type)}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left focus:outline-none ${
                      selectedCategory === type
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Summary */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-800 mb-4'>
                Issue Summary
              </h2>
              <div className='space-y-3'>
                {['performance', 'accessibility', 'seo', 'best-practices'].map(
                  (category) => {
                    const uniqueIssues = getUniqueIssues(issues);
                    const count = uniqueIssues.filter(
                      (issue) => issue.type === category
                    ).length;

                    return (
                      <div
                        key={category}
                        className={`p-3 rounded-lg ${getTypeColor(category)}`}
                      >
                        <div className='text-lg font-bold'>{count}</div>
                        <div className='text-sm'>
                          {category.charAt(0).toUpperCase() + category.slice(1)}{' '}
                          Issues
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className='col-span-12 lg:col-span-9 space-y-6'>
            {/* Original Issues Section */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <h2 className='text-xl font-bold text-gray-800 mb-6'>
                DOM Elements with Issues
              </h2>

              {/* Elements List */}
              <div className='space-y-6'>
                {/* Meta Description Section */}
                {scannedElements.filter(
                  (element) =>
                    element.tag === 'meta' &&
                    element.attributes.find(
                      (attr) =>
                        attr.name === 'name' && attr.value === 'description'
                    )
                ).length === 0 && (
                  <div className='border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow'>
                    {/* Element Header */}
                    <div className='mb-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='text-lg font-semibold text-gray-800'>
                          Missing Meta Description
                        </h3>
                        <div className='flex gap-2'>
                          <span className='px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border-orange-200'>
                            SEO
                          </span>
                        </div>
                      </div>
                      <p className='text-gray-600 text-sm'>
                        Your page is missing a meta description tag which is
                        important for SEO.
                      </p>
                    </div>

                    {/* Meta Description Fix */}
                    <div className='bg-gray-50 p-4 rounded-lg'>
                      <h4 className='font-medium text-gray-800 mb-2'>
                        Suggested Fix:
                      </h4>
                      <code className='block text-black text-sm font-mono bg-gray-100 p-3 rounded'>
                        {
                          '<meta name="description" content="Add your website description here">'
                        }
                      </code>
                      <p className='mt-2 text-sm text-gray-600'>
                        Add this tag inside your {'<head>'} section with a
                        descriptive content that summarizes your page.
                      </p>
                    </div>
                  </div>
                )}

                {/* Missing Alt Attributes Section */}
                {scannedElements.filter(
                  (element) =>
                    element.tag === 'img' &&
                    (!element.attributes.find((attr) => attr.name === 'alt') ||
                      element.attributes.find(
                        (attr) => attr.name === 'alt' && attr.value === ''
                      ))
                ).length > 0 && (
                  <div className='border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow'>
                    {/* Element Header */}
                    <div className='mb-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='text-lg font-semibold text-gray-800'>
                          Images Missing Alt Attributes
                        </h3>
                        <div className='flex gap-2'>
                          <span className='px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border-green-200'>
                            Accessibility
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Images List */}
                    <div className='space-y-4'>
                      {scannedElements
                        .filter(
                          (element) =>
                            element.tag === 'img' &&
                            (!element.attributes.find(
                              (attr) => attr.name === 'alt'
                            ) ||
                              element.attributes.find(
                                (attr) =>
                                  attr.name === 'alt' && attr.value === ''
                              ))
                        )
                        .map((element, index) => (
                          <div
                            key={index}
                            className='border-t border-gray-100 pt-4'
                          >
                            <code className='block text-black text-sm font-mono bg-gray-100 p-3 rounded'>
                              {`<img ${element.attributes
                                .map((attr) => `${attr.name}="${attr.value}"`)
                                .join(' ')}>`}
                            </code>
                            <div className='mt-2 text-sm text-gray-600'>
                              Found at: {element.location || 'Unknown location'}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* All Issues with AI Fixes */}
                {hasAIAvailable && Object.keys(fixSuggestions).length > 0 && (
                  <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
                    <h2 className='text-xl font-semibold text-gray-800 mb-4'>
                      🤖 AI-Generated Fixes
                    </h2>
                    <div className='space-y-6'>
                      {Object.entries(fixSuggestions).map(
                        ([issueTitle, suggestions]) => (
                          <div
                            key={issueTitle}
                            className='border-b border-gray-100 pb-6 last:border-b-0'
                          >
                            <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                              {issueTitle}
                            </h3>

                            {/* Find the original issue for context */}
                            {(() => {
                              const originalIssue = issues.find(
                                (issue) => issue.title === issueTitle
                              );
                              return originalIssue ? (
                                <div className='mb-4'>
                                  <p className='text-gray-600 mb-2'>
                                    {originalIssue.description}
                                  </p>
                                  {originalIssue.type && (
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        originalIssue.type === 'performance'
                                          ? 'bg-blue-100 text-blue-800'
                                          : originalIssue.type ===
                                            'accessibility'
                                          ? 'bg-green-100 text-green-800'
                                          : originalIssue.type === 'seo'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {originalIssue.type}
                                    </span>
                                  )}
                                </div>
                              ) : null;
                            })()}

                            <div className='bg-gray-50 rounded-lg p-4 space-y-4'>
                              <h4 className='font-medium text-gray-800 flex items-center gap-2'>
                                <svg
                                  className='w-5 h-5 text-blue-600'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                                  />
                                </svg>
                                AI Recommendations ({suggestions.length})
                              </h4>

                              {suggestions.map((suggestion, sugIndex) => {
                                const suggestionKey = `${issueTitle}-${sugIndex}`;
                                const showScreenshot =
                                  screenshotStates[suggestionKey] || false;
                                const showComparison =
                                  comparisonStates[suggestionKey] || false;

                                return (
                                  <div
                                    key={sugIndex}
                                    className='bg-white rounded-lg p-4 border border-gray-200'
                                  >
                                    <div className='mb-3'>
                                      <h5 className='font-medium text-gray-800 mb-2'>
                                        {suggestion.description}
                                      </h5>
                                      {suggestion.implementation && (
                                        <p className='text-sm text-gray-600 mb-2'>
                                          <strong>Implementation:</strong>{' '}
                                          {suggestion.implementation}
                                        </p>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className='flex flex-wrap gap-2 mb-4'>
                                      <button
                                        onClick={() =>
                                          setScreenshotStates((prev) => ({
                                            ...prev,
                                            [suggestionKey]: !showScreenshot,
                                          }))
                                        }
                                        className='inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                                      >
                                        <svg
                                          className='w-4 h-4'
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                          />
                                        </svg>
                                        {showScreenshot
                                          ? 'Hide Screenshot'
                                          : 'Show Screenshot'}
                                      </button>

                                      <button
                                        onClick={() =>
                                          setComparisonStates((prev) => ({
                                            ...prev,
                                            [suggestionKey]: !showComparison,
                                          }))
                                        }
                                        className='inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'
                                      >
                                        <svg
                                          className='w-4 h-4'
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                                          />
                                        </svg>
                                        {showComparison
                                          ? 'Hide Comparison'
                                          : 'Before/After'}
                                      </button>

                                      <button
                                        onClick={() =>
                                          handleApplyFix(suggestion)
                                        }
                                        className='inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors'
                                      >
                                        <svg
                                          className='w-4 h-4'
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                          />
                                        </svg>
                                        Apply Fix
                                      </button>
                                    </div>

                                    {(suggestion.code ||
                                      suggestion.codeExample) && (
                                      <div className='bg-gray-50 p-3 rounded-lg mb-3'>
                                        <span className='block text-sm text-gray-600 mb-2 font-medium'>
                                          Code Example:
                                        </span>
                                        <pre className='text-black text-sm bg-gray-100 p-3 rounded overflow-x-auto'>
                                          <code>
                                            {suggestion.code ||
                                              suggestion.codeExample}
                                          </code>
                                        </pre>
                                      </div>
                                    )}

                                    {(suggestion.impact ||
                                      suggestion.expectedImpact) && (
                                      <div className='text-sm text-green-700 bg-green-50 p-2 rounded mb-3'>
                                        <strong>Expected Impact:</strong>{' '}
                                        {suggestion.impact ||
                                          suggestion.expectedImpact}
                                      </div>
                                    )}

                                    {/* Screenshot Section */}
                                    {showScreenshot && (
                                      <div className='mt-4 pt-4 border-t border-gray-200'>
                                        <IssueScreenshot
                                          issue={{
                                            title: issueTitle,
                                            type:
                                              issues.find(
                                                (i) => i.title === issueTitle
                                              )?.type || 'accessibility',
                                            selector: issues.find(
                                              (i) => i.title === issueTitle
                                            )?.selector,
                                          }}
                                          websiteUrl={websiteUrl}
                                          className='max-w-2xl mx-auto'
                                        />
                                      </div>
                                    )}

                                    {/* Before/After Comparison Section */}
                                    {showComparison && (
                                      <div className='mt-4 pt-4 border-t border-gray-200'>
                                        <BeforeAfterComparison
                                          title={`Fix: ${issueTitle}`}
                                          className='max-w-2xl mx-auto'
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Original Elements with Issues */}
                {Object.keys(groupedIssues)
                  .filter((selector) =>
                    selectedCategory === 'all'
                      ? true
                      : groupedIssues[selector].some(
                          (issue) => issue.type === selectedCategory
                        )
                  )
                  .map((selector, index) => {
                    const elementIssues = groupedIssues[selector].filter(
                      (issue) =>
                        selectedCategory === 'all' ||
                        issue.type === selectedCategory
                    );

                    return (
                      <div
                        key={index}
                        className='border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow'
                      >
                        {/* Element Header */}
                        <div className='mb-4'>
                          <div className='flex items-center justify-between mb-2'>
                            <code className='text-black bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-mono whitespace-pre'>
                              {(() => {
                                const parts = selector
                                  .split(' > ')
                                  .map((part) => {
                                    // Split by both . and # but keep the delimiters
                                    const segments = part.split(/([.#\[])/);
                                    const tag = segments[0];

                                    // Process segments to collect classes, ids, and other attributes
                                    let classes = [];
                                    let id = null;
                                    let otherAttributes = {};

                                    for (
                                      let i = 1;
                                      i < segments.length;
                                      i += 2
                                    ) {
                                      const delimiter = segments[i];
                                      const value = segments[i + 1];

                                      if (delimiter === '.') {
                                        classes.push(value);
                                      } else if (delimiter === '#') {
                                        id = value;
                                      } else if (delimiter === '[') {
                                        // Handle attribute selectors [attr="value"]
                                        const attrMatch = value.match(
                                          /([^=\]]+)(?:="([^"]*)")?\]/
                                        );
                                        if (attrMatch) {
                                          const [, attrName, attrValue] =
                                            attrMatch;
                                          otherAttributes[attrName] =
                                            attrValue || '';
                                        }
                                      }
                                    }

                                    // Get element's actual attributes from the issues
                                    const elementIssue = elementIssues.find(
                                      (issue) =>
                                        issue.element?.attributes?.some(
                                          (attr) =>
                                            (attr.name === 'class' &&
                                              attr.value ===
                                                classes.join(' ')) ||
                                            (attr.name === 'id' &&
                                              attr.value === id)
                                        )
                                    );

                                    if (elementIssue?.element?.attributes) {
                                      elementIssue.element.attributes.forEach(
                                        (attr) => {
                                          if (
                                            attr.name !== 'class' &&
                                            attr.name !== 'id'
                                          ) {
                                            otherAttributes[attr.name] =
                                              attr.value;
                                          }
                                        }
                                      );
                                    }

                                    return {
                                      tag,
                                      classes: classes.length
                                        ? classes.join(' ')
                                        : null,
                                      id,
                                      attributes: otherAttributes,
                                    };
                                  });

                                let output = '';
                                // Add opening tags with indentation
                                parts.forEach((part, index) => {
                                  const indent = ' '.repeat(index * 2);
                                  const attrs = [];

                                  if (part.id) attrs.push(`id="${part.id}"`);
                                  if (part.classes)
                                    attrs.push(`class="${part.classes}"`);

                                  // Add other attributes
                                  Object.entries(part.attributes || {}).forEach(
                                    ([key, value]) => {
                                      attrs.push(`${key}="${value}"`);
                                    }
                                  );

                                  const attributes = attrs.length
                                    ? ' ' + attrs.join(' ')
                                    : '';
                                  output += `${indent}<${part.tag}${attributes}>\n`;
                                });

                                // Add closing tags with proper indentation
                                [...parts].reverse().forEach((part, index) => {
                                  const indent = ' '.repeat(
                                    (parts.length - 1 - index) * 2
                                  );
                                  output += `${indent}</${part.tag}>\n`;
                                });

                                return output.trim();
                              })()}
                            </code>
                            <div className='flex gap-2'>
                              {Array.from(
                                new Set(
                                  elementIssues.map((issue) => issue.type)
                                )
                              ).map((type) => (
                                <span
                                  key={type}
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                                    type
                                  )}`}
                                >
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Issues for this element */}
                        <div className='space-y-4'>
                          {elementIssues.map((issue, issueIndex) => {
                            const suggestions =
                              fixSuggestions[issue.title] || [];

                            return (
                              <div
                                key={issueIndex}
                                className='border-t border-gray-100 pt-4'
                              >
                                <div className='flex items-center justify-between mb-2'>
                                  <h3 className='text-lg font-semibold text-gray-800'>
                                    {issue.title}
                                  </h3>
                                  <div className='flex items-center gap-2'>
                                    {issue.impact && (
                                      <span className='bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium'>
                                        Impact: {Math.round(issue.impact)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className='text-gray-600 mb-3'>
                                  {issue.description}
                                </p>

                                {/* Fix Suggestions */}
                                {hasAIAvailable ? (
                                  suggestions.length > 0 ? (
                                    <div className='bg-gray-50 rounded-lg p-4 space-y-3 mt-4'>
                                      <div className='flex items-center justify-between'>
                                        <h4 className='font-medium text-gray-800'>
                                          AI Fix Suggestions:
                                        </h4>
                                        <button
                                          onClick={() =>
                                            handleApplyFix(suggestions[0])
                                          }
                                          className='bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm'
                                        >
                                          Apply Fix
                                        </button>
                                      </div>
                                      {suggestions.map(
                                        (suggestion, sugIndex) => (
                                          <div
                                            key={sugIndex}
                                            className='bg-white rounded-lg p-4 border border-gray-200'
                                          >
                                            <div className='flex items-center justify-between mb-3'>
                                              <p className='text-gray-700 font-medium'>
                                                {suggestion.description}
                                              </p>
                                            </div>

                                            {suggestion.code && (
                                              <div className='bg-gray-50 p-3 rounded-lg mt-2'>
                                                <span className='block text-sm text-gray-600 mb-1'>
                                                  Proposed Changes:
                                                </span>
                                                <pre className='text-black text-sm bg-gray-100 p-2 rounded overflow-x-auto'>
                                                  <code>{suggestion.code}</code>
                                                </pre>
                                              </div>
                                            )}

                                            {suggestion.impact && (
                                              <div className='mt-2 text-sm text-gray-600'>
                                                Expected Impact:{' '}
                                                {suggestion.impact}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4'>
                                      <div className='flex items-center gap-3'>
                                        <svg
                                          className='w-5 h-5 text-blue-600'
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                          />
                                        </svg>
                                        <div>
                                          <h4 className='font-medium text-blue-900'>
                                            AI Suggestions Loading...
                                          </h4>
                                          <p className='text-sm text-blue-700'>
                                            Configure AI in development mode to
                                            get automated fix suggestions
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4'>
                                    <div className='flex items-center gap-3'>
                                      <svg
                                        className='w-5 h-5 text-gray-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                      >
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                        />
                                      </svg>
                                      <div>
                                        <h4 className='font-medium text-gray-900'>
                                          Manual Fix Required
                                        </h4>
                                        <p className='text-sm text-gray-600'>
                                          AI suggestions not available. Please
                                          review the issue description and
                                          implement fixes manually.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {Object.keys(groupedIssues).filter((selector) =>
                  selectedCategory === 'all'
                    ? true
                    : groupedIssues[selector].some(
                        (issue) => issue.type === selectedCategory
                      )
                ).length === 0 && (
                  <div className='text-center py-8'>
                    <p className='text-gray-600'>
                      No DOM elements found with issues in the selected
                      category.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Display scanned elements */}
            {/* <div className='mt-8'>
              <h2 className='text-2xl font-bold mb-4'>Scanned Elements</h2>
              {isScanning ? (
                <div className='text-gray-600'>
                  Scanning website elements...
                </div>
              ) : scannedElements.length > 0 ? (
                <div className='space-y-4'>
                  {scannedElements.map((element, index) => (
                    <div key={index} className='p-4 bg-white rounded-lg shadow'>
                      <div className='flex items-center space-x-2'>
                        <span className='font-mono text-blue-600'>
                          {element.tag}
                        </span>
                        {element.id && (
                          <span className='text-gray-600'>#{element.id}</span>
                        )}
                        {element.classes.length > 0 && (
                          <span className='text-green-600'>
                            .{element.classes.join(".")}
                          </span>
                        )}
                      </div>
                      {element.textContent && (
                        <div className='mt-2 text-gray-700 truncate'>
                          {element.textContent}
                        </div>
                      )}
                      <div className='mt-2 text-sm text-gray-500'>
                        Path: {element.path}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-gray-600'>No elements scanned yet.</div>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIFix;
