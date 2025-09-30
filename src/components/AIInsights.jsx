import PropTypes from 'prop-types';

function AIInsights({ aiAnalysis, aiLoading }) {
  if (aiLoading) {
    return (
      <div className='bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4'></div>
        <p className='text-gray-600'>Generating AI insights...</p>
      </div>
    );
  }

  if (!aiAnalysis) {
    return null;
  }

  return (
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
        <h3 className='text-xl font-bold text-gray-900'>AI Insights</h3>
      </div>
      <div className='prose prose-gray max-w-none'>
        <pre className='whitespace-pre-wrap text-gray-700 leading-relaxed'>
          {aiAnalysis}
        </pre>
      </div>
    </div>
  );
}

AIInsights.propTypes = {
  aiAnalysis: PropTypes.string,
  aiLoading: PropTypes.bool,
};

AIInsights.defaultProps = {
  aiAnalysis: null,
  aiLoading: false,
};

export default AIInsights;
