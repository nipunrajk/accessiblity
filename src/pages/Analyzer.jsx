import { useParams } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalysis';
import { isAIAvailable } from '../config/aiConfig';
import Header from '../components/Header';
import AnalysisForm from '../components/AnalysisForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ScoreOverview from '../components/ScoreOverview';
import AIInsights from '../components/AIInsights';
import ScoreCard from '../components/ScoreCard';
import IssueReport from '../components/IssueReport';

function Analyzer() {
  const { id } = useParams();
  const {
    loading,
    results,
    error,
    aiAnalysis,
    aiLoading,
    scanStats,
    websiteUrl,
    runAnalysis,
    navigateToAiFix,
    clearAnalysis,
  } = useAnalysis();

  // Check if AI is available
  const hasAIAvailable = isAIAvailable();

  // TODO: Implement loadAnalysis for existing analysis IDs if needed

  return (
    <div className='min-h-screen bg-white'>
      <Header />

      <div className='max-w-7xl mx-auto px-6 py-12'>
        {/* Hero Section - Show only when no results */}
        {!results && <AnalysisForm onSubmit={runAnalysis} loading={loading} />}

        {/* Loading State */}
        {loading && <LoadingState scanStats={scanStats} />}

        {/* Error State */}
        {error && <ErrorState error={error} />}

        {/* Results Section */}
        {results && (
          <div className='space-y-8'>
            {/* Header with URL */}
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                Analysis Complete
              </h2>
              <p className='text-gray-600'>Analysis results ready</p>
            </div>

            {/* Score Overview */}
            <ScoreOverview results={results} />

            {/* AI Insights - Only show if AI is available */}
            {hasAIAvailable ? (
              <AIInsights aiAnalysis={aiAnalysis} aiLoading={aiLoading} />
            ) : (
              <div className='bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
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
                        d='M13 10V3L4 14h7v7l9-11h-7z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Want AI-Powered Insights?
                    </h3>
                    <p className='text-gray-600 text-sm'>
                      Configure AI in{' '}
                      <code className='bg-gray-200 px-1 rounded'>
                        src/config/aiConfig.js
                      </code>{' '}
                      to unlock advanced analysis
                    </p>
                  </div>
                </div>
                <div className='text-sm text-gray-600'>
                  <p className='mb-2'>
                    <strong>Quick setup:</strong> Add OpenRouter API key for{' '}
                    <strong>xAI Grok 4 Fast</strong> (free & fastest)
                  </p>
                  <p className='mb-2'>AI analysis includes:</p>
                  <ul className='list-disc list-inside space-y-1 text-gray-600'>
                    <li>Detailed performance insights</li>
                    <li>Specific optimization recommendations</li>
                    <li>Accessibility improvement suggestions</li>
                    <li>SEO enhancement tips</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className='text-center space-y-4'>
              <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                <button
                  onClick={() => navigateToAiFix()}
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
                  {hasAIAvailable ? 'Get AI Fixes' : 'View Issues'}
                </button>

                <button
                  onClick={clearAnalysis}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors'
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
                <p className='text-sm text-gray-500'>
                  Current analysis:{' '}
                  <span className='font-medium'>{websiteUrl}</span>
                </p>
              )}
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
