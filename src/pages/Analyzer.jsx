import { useParams } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalysis';
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
    runAnalysis,
    navigateToAiFix,
  } = useAnalysis();

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

            {/* AI Insights */}
            <AIInsights aiAnalysis={aiAnalysis} aiLoading={aiLoading} />

            {/* Action Button */}
            <div className='text-center'>
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
