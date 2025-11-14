import { useState } from 'react';
import PropTypes from 'prop-types';
import { useScreenshots } from '../hooks/useScreenshots';
import ScreenshotGallery from './ScreenshotGallery';

export default function ScreenshotButton({ url, issues }) {
  const [showGallery, setShowGallery] = useState(false);
  const {
    loading,
    screenshots,
    error,
    captureIssueScreenshots,
    downloadScreenshot,
    downloadAllScreenshots,
  } = useScreenshots();

  const handleCaptureScreenshots = async () => {
    try {
      // Filter issues that have selectors
      const issuesWithSelectors = issues.filter(
        (issue) =>
          issue.selector || issue.nodes?.[0]?.selector || issue.node?.selector
      );

      if (issuesWithSelectors.length === 0) {
        const message =
          `No issues with selectors found. Screenshots require element selectors to highlight issues.\n\n` +
          `Total issues: ${issues.length}\n` +
          `Issues with selectors: 0\n\n` +
          `Tip: The DOM scanner (element issues) provides selectors. Lighthouse issues typically don't include selectors.`;
        alert(message);
        return;
      }

      // Format issues for screenshot service
      const formattedIssues = issuesWithSelectors.map((issue) => ({
        title: issue.title || issue.description || 'Issue',
        description: issue.description || issue.message || '',
        severity: issue.severity || issue.impact || 'medium',
        selector:
          issue.selector ||
          issue.nodes?.[0]?.selector ||
          issue.node?.selector ||
          '',
      }));

      await captureIssueScreenshots(url, formattedIssues);
      setShowGallery(true);
    } catch (err) {
      console.error('Failed to capture screenshots:', err);
      alert('Failed to capture screenshots. Please try again.');
    }
  };

  return (
    <>
      <div className='flex gap-3'>
        <button
          onClick={handleCaptureScreenshots}
          disabled={loading || !url || !issues || issues.length === 0}
          className='flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm'
        >
          {loading ? (
            <>
              <svg
                className='animate-spin h-5 w-5'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Capturing...
            </>
          ) : (
            <>
              <svg
                className='w-5 h-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
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
              Capture Screenshots
            </>
          )}
        </button>

        {screenshots.length > 0 && (
          <button
            onClick={() => setShowGallery(!showGallery)}
            className='flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            {showGallery ? 'Hide' : 'Show'} Gallery ({screenshots.length})
          </button>
        )}

        {screenshots.length > 1 && (
          <button
            onClick={() => downloadAllScreenshots(screenshots)}
            className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
              />
            </svg>
            Download All
          </button>
        )}
      </div>

      {error && (
        <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
          {error}
        </div>
      )}

      {issues && issues.length > 0 && (
        <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm'>
          <p className='font-medium mb-1'>📊 Screenshot Availability</p>
          <p>
            {
              issues.filter(
                (i) => i.selector || i.nodes?.[0]?.selector || i.node?.selector
              ).length
            }{' '}
            of {issues.length} issues have selectors and can be captured.
          </p>
          {issues.filter(
            (i) => i.selector || i.nodes?.[0]?.selector || i.node?.selector
          ).length === 0 && (
            <p className='mt-2 text-xs'>
              💡 Tip: Element-level issues from the DOM scanner include
              selectors. Lighthouse summary issues typically don't.
            </p>
          )}
        </div>
      )}

      {showGallery && screenshots.length > 0 && (
        <div className='mt-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Issue Screenshots ({screenshots.length})
            </h3>
            <button
              onClick={() => setShowGallery(false)}
              className='text-gray-500 hover:text-gray-700'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
          <ScreenshotGallery
            screenshots={screenshots}
            onDownload={downloadScreenshot}
          />
        </div>
      )}
    </>
  );
}

ScreenshotButton.propTypes = {
  url: PropTypes.string.isRequired,
  issues: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      severity: PropTypes.string,
      selector: PropTypes.string,
      node: PropTypes.shape({
        selector: PropTypes.string,
      }),
    })
  ).isRequired,
};
