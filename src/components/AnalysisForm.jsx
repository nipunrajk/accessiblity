import { useState } from 'react';

function AnalysisForm({ onSubmit, loading }) {
  const [websiteUrl, setWebsiteUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(websiteUrl);
  };

  return (
    <div className='text-center mb-16'>
      <h1 className='text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-4'>
        Website Analysis
      </h1>
      <p className='text-xl text-gray-600 dark:text-dark-text-secondary mb-12 max-w-2xl mx-auto'>
        Enter the URL of the website you want to analyze for accessibility,
        performance, and SEO issues.
      </p>

      <form onSubmit={handleSubmit} className='max-w-2xl mx-auto'>
        <div className='flex gap-3 mb-4'>
          <input
            type='url'
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder='Enter website URL'
            required
            className='flex-1 px-6 py-4 text-lg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted'
          />
          <button
            type='submit'
            disabled={loading}
            className='px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
          >
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                Analyzing
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </div>

        <div className='text-center'>
          <button
            type='button'
            onClick={() => onSubmit('demo')}
            className='text-sm text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary underline'
          >
            Try with sample data
          </button>
        </div>
      </form>
    </div>
  );
}

export default AnalysisForm;
