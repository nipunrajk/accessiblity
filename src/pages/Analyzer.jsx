import { useAnalysis } from '../hooks/useAnalysis';
import { isAIAvailable } from '../config/aiConfig';
import Header from '../components/Header';
import AnalysisForm from '../components/AnalysisForm';
import ErrorState from '../components/ErrorState';
import ScoreOverview from '../components/ScoreOverview';
import AIInsights from '../components/AIInsights';
import AILoadingState from '../components/AILoadingState';
import IssueReport from '../components/IssueReport';
import ScreenshotButton from '../components/ScreenshotButton';
import AxeViolations from '../components/AxeViolations';
import AxeScoreCard from '../components/AxeScoreCard';

function Analyzer() {
  const {
    loading,
    results,
    error,
    aiAnalysis,
    aiLoading,
    websiteUrl,
    elementIssues,
    runAnalysis,
    navigateToAiFix,
    clearAnalysis,
  } = useAnalysis();

  // Check if AI is available
  const hasAIAvailable = isAIAvailable();

  return (
    <div className='min-h-screen bg-white dark:bg-dark-bg transition-colors'>
      <Header />

      <div className='max-w-7xl mx-auto px-6 py-12'>
        {/* Hero Section - Show only when no results */}
        {!results && <AnalysisForm onSubmit={runAnalysis} loading={loading} />}

        {/* Error State */}
        {error && <ErrorState error={error} />}

        {/* Results Section */}
        {results && (
          <div className='space-y-8'>
            {/* Header with URL */}
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                Website Analysis
              </h2>
              <p className='text-gray-600 dark:text-gray-400'>
                Enter the URL of the website you want to analyze for
                accessibility, performance, and SEO issues.
              </p>
            </div>

            {/* Score Overview */}
            <ScoreOverview results={results} />

            {/* AI Insights - Only show if AI is available */}
            {hasAIAvailable ? (
              aiLoading ? (
                <AILoadingState isLoading={aiLoading} />
              ) : (
                <AIInsights aiAnalysis={aiAnalysis} aiLoading={aiLoading} />
              )
            ) : (
              <div className='bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-blue-600 dark:text-blue-400'
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
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text-primary'>
                      Want AI-Powered Insights?
                    </h3>
                    <p className='text-gray-600 dark:text-dark-text-secondary text-sm'>
                      Configure AI in{' '}
                      <code className='bg-gray-200 dark:bg-gray-800 px-1 rounded-sm'>
                        src/config/aiConfig.js
                      </code>{' '}
                      to unlock advanced analysis
                    </p>
                  </div>
                </div>
                <div className='text-sm text-gray-600 dark:text-dark-text-secondary'>
                  <p className='mb-2'>
                    <strong>Quick setup:</strong> Add OpenRouter API key for{' '}
                    <strong>xAI Grok 4 Fast</strong> (free & fastest)
                  </p>
                  <p className='mb-2'>AI analysis includes:</p>
                  <ul className='list-disc list-inside space-y-1 text-gray-600 dark:text-dark-text-secondary'>
                    <li>Detailed performance insights</li>
                    <li>Specific optimization recommendations</li>
                    <li>Accessibility improvement suggestions</li>
                    <li>SEO enhancement tips</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Screenshot Feature */}
            {websiteUrl && (
              <div className='bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-purple-600 dark:text-purple-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text-primary'>
                      Visual Issue Documentation
                    </h3>
                    <p className='text-gray-600 dark:text-dark-text-secondary text-sm'>
                      Capture annotated screenshots of element-level issues
                    </p>
                  </div>
                  {elementIssues && elementIssues.length > 0 && (
                    <div className='bg-purple-100 dark:bg-purple-900/50 px-3 py-1 rounded-full'>
                      <span className='text-sm font-semibold text-purple-700 dark:text-purple-300'>
                        {elementIssues.length} elements
                      </span>
                    </div>
                  )}
                </div>
                <ScreenshotButton
                  url={websiteUrl}
                  issues={[
                    ...(results?.accessibility?.issues || []),
                    ...(results?.performance?.issues || []),
                    ...(results?.bestPractices?.issues || []),
                    ...(results?.seo?.issues || []),
                    ...(elementIssues || []),
                  ]}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className='text-center space-y-4'>
              <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                <button
                  onClick={() => navigateToAiFix()}
                  className='inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-medium transition-colors'
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
                  {hasAIAvailable ? 'Get AI Fixes' : 'View Issues'}
                </button>

                <button
                  onClick={clearAnalysis}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
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
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  New Analysis
                </button>
              </div>

              {websiteUrl && (
                <p className='text-sm text-gray-500 dark:text-dark-text-muted'>
                  Current analysis:{' '}
                  <span className='font-medium'>{websiteUrl}</span>
                </p>
              )}
            </div>

            {/* Enhanced Axe-Core Results */}
            {results && results.scores && (
              <AxeScoreCard
                scores={results.scores}
                wcagCompliance={results.accessibility?.wcagCompliance}
              />
            )}

            {/* Axe-Core Violations */}
            {results && results.accessibility?.violations && (
              <AxeViolations
                violations={results.accessibility.violations}
                incomplete={results.accessibility?.incomplete}
                passes={results.accessibility?.passes}
                showPasses={false}
              />
            )}

            {/* Fallback to Original Issue Report */}
            <IssueReport results={results} websiteUrl={websiteUrl} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Analyzer;
