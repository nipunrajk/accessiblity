import { useState } from 'react';

function AnalysisForm({ onSubmit, loading }) {
  const [websiteUrl, setWebsiteUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(websiteUrl);
  };

  return (
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
  );
}

export default AnalysisForm;
