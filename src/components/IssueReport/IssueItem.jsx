import { useState } from 'react';
import IssueScreenshot from '../IssueScreenshot';
import BeforeAfterComparison from '../BeforeAfterComparison';

function IssueItem({ issue, websiteUrl }) {
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const getTypeColorClass = (type) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'accessibility':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'best-practices':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'seo':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'keyboard':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className='border border-gray-200 dark:border-dark-border rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2 flex-wrap'>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColorClass(
                issue.type
              )}`}
            >
              {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
            </span>
            {issue.detectedBy && issue.detectedBy.length > 0 && (
              <div className='flex items-center gap-1'>
                {issue.detectedBy.map((tool) => (
                  <span
                    key={tool}
                    className='text-xs px-2 py-0.5 rounded-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    title={`Detected by ${tool}`}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2'>
            {issue.title}
          </h3>
          <p className='text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-4'>
            {issue.description}
          </p>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setShowScreenshot(!showScreenshot)}
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
              {showScreenshot ? 'Hide Screenshot' : 'Show Screenshot'}
            </button>

            <button
              onClick={() => setShowComparison(!showComparison)}
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
              {showComparison ? 'Hide Comparison' : 'Before/After'}
            </button>

            {issue.selector && (
              <button
                onClick={() => {
                  // Copy CSS selector to clipboard
                  navigator.clipboard.writeText(issue.selector);
                }}
                className='inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors'
                title='Copy CSS selector'
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
                    d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
                Copy Selector
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Section */}
      {showScreenshot && (
        <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <IssueScreenshot
            issue={issue}
            websiteUrl={websiteUrl}
            className='max-w-2xl mx-auto'
          />
        </div>
      )}

      {/* Before/After Comparison Section */}
      {showComparison && (
        <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <BeforeAfterComparison
            title={`Fix: ${issue.title}`}
            className='max-w-2xl mx-auto'
          />
        </div>
      )}
    </div>
  );
}

export default IssueItem;
