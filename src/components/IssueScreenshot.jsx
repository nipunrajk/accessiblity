import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import screenshotService from '../services/screenshotService';

function IssueScreenshot({ issue, websiteUrl, className = '' }) {
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (issue && websiteUrl) {
      captureScreenshot();
    }
  }, [issue, websiteUrl]);

  const captureScreenshot = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the real screenshot service with issue highlights
      const result = await screenshotService.captureWithHighlights(
        websiteUrl,
        [issue],
        {
          width: 1200,
          height: 800,
          fullPage: false,
        }
      );

      if (result.success) {
        setScreenshot(result);
      } else {
        setError(result.error || 'Failed to capture screenshot');
      }
    } catch (err) {
      console.error('Screenshot capture error:', err);
      setError('Failed to capture screenshot');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center ${className}`}
      >
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
        <p className='text-gray-600 dark:text-gray-400'>
          Capturing screenshot...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center ${className}`}
      >
        <div className='text-red-500 mb-4'>
          <svg
            className='w-12 h-12 mx-auto'
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
        <p className='text-gray-600 dark:text-gray-400'>{error}</p>
        <button
          onClick={captureScreenshot}
          className='mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
        >
          Retry
        </button>
      </div>
    );
  }

  if (!screenshot) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <div className='relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg'>
        {/* Screenshot Image */}
        <img
          src={screenshot.screenshot}
          alt={`Screenshot showing ${issue.title}`}
          className='w-full h-auto'
        />

        {/* Note: Highlights are already rendered in the screenshot by the backend */}
      </div>

      {/* Screenshot Info */}
      <div className='mt-3 text-center'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Screenshot highlighting:{' '}
          <span className='font-medium'>{issue.title}</span>
        </p>
      </div>
    </div>
  );
}

IssueScreenshot.propTypes = {
  issue: PropTypes.shape({
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    selector: PropTypes.string,
  }).isRequired,
  websiteUrl: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default IssueScreenshot;
