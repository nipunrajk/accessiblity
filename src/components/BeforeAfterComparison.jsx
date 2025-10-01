import { useState } from 'react';
import PropTypes from 'prop-types';

function BeforeAfterComparison({
  beforeImage,
  afterImage,
  title,
  className = '',
}) {
  const [showAfter, setShowAfter] = useState(false);

  // Create realistic before/after mock images
  const createMockImage = (type) => {
    const svg =
      type === 'before'
        ? `
      <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
        <!-- Before: Website with issues -->
        <rect width="800" height="400" fill="#ffffff"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="800" height="60" fill="#f8fafc"/>
        <rect x="20" y="15" width="80" height="30" rx="4" fill="#ef4444"/>
        <text x="60" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="white">Logo</text>
        
        <!-- Problem area highlighted -->
        <rect x="20" y="80" width="760" height="200" fill="#fef2f2" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5"/>
        <rect x="40" y="100" width="150" height="100" fill="#fee2e2"/>
        <text x="115" y="155" text-anchor="middle" font-family="Arial" font-size="10" fill="#dc2626">Missing alt text</text>
        
        <!-- Content -->
        <rect x="210" y="100" width="300" height="12" fill="#374151"/>
        <rect x="210" y="125" width="250" height="8" fill="#6b7280"/>
        <rect x="210" y="140" width="280" height="8" fill="#6b7280"/>
        
        <!-- Issue indicator -->
        <circle cx="750" cy="120" r="15" fill="#ef4444"/>
        <text x="750" y="125" text-anchor="middle" font-family="Arial" font-size="12" fill="white">!</text>
        
        <!-- Footer -->
        <rect x="0" y="320" width="800" height="80" fill="#374151"/>
        <text x="400" y="365" text-anchor="middle" font-family="Arial" font-size="10" fill="#9ca3af">© 2024 Company</text>
      </svg>
    `
        : `
      <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
        <!-- After: Website with issues fixed -->
        <rect width="800" height="400" fill="#ffffff"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="800" height="60" fill="#f8fafc"/>
        <rect x="20" y="15" width="80" height="30" rx="4" fill="#22c55e"/>
        <text x="60" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="white">Logo</text>
        
        <!-- Fixed area highlighted -->
        <rect x="20" y="80" width="760" height="200" fill="#f0fdf4" stroke="#22c55e" stroke-width="2" stroke-dasharray="5,5"/>
        <rect x="40" y="100" width="150" height="100" fill="#dcfce7"/>
        <text x="115" y="155" text-anchor="middle" font-family="Arial" font-size="10" fill="#16a34a">Alt text added</text>
        
        <!-- Content -->
        <rect x="210" y="100" width="300" height="12" fill="#374151"/>
        <rect x="210" y="125" width="250" height="8" fill="#6b7280"/>
        <rect x="210" y="140" width="280" height="8" fill="#6b7280"/>
        
        <!-- Success indicator -->
        <circle cx="750" cy="120" r="15" fill="#22c55e"/>
        <text x="750" y="125" text-anchor="middle" font-family="Arial" font-size="12" fill="white">✓</text>
        
        <!-- Footer -->
        <rect x="0" y="320" width="800" height="80" fill="#374151"/>
        <text x="400" y="365" text-anchor="middle" font-family="Arial" font-size="10" fill="#9ca3af">© 2024 Company</text>
      </svg>
    `;
    // Use URL encoding instead of base64 to avoid btoa issues with special characters
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  const currentBefore = beforeImage || createMockImage('before');
  const currentAfter = afterImage || createMockImage('after');

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg ${className}`}
    >
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
          {title || 'Before/After Comparison'}
        </h3>
      </div>

      {/* Toggle Buttons */}
      <div className='px-6 py-4 bg-gray-50 dark:bg-gray-800'>
        <div className='flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1'>
          <button
            onClick={() => setShowAfter(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !showAfter
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Before
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              showAfter
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            After
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div className='relative'>
        <img
          src={showAfter ? currentAfter : currentBefore}
          alt={showAfter ? 'After fix applied' : 'Before fix applied'}
          className='w-full h-auto'
        />

        {/* Status Badge */}
        <div className='absolute top-4 right-4'>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              showAfter
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {showAfter ? (
              <>
                <svg
                  className='w-4 h-4 mr-1'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                Fixed
              </>
            ) : (
              <>
                <svg
                  className='w-4 h-4 mr-1'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
                Issue
              </>
            )}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className='px-6 py-4'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          {showAfter
            ? 'After applying the suggested fix, the accessibility issue has been resolved.'
            : 'The original state showing the accessibility issue that needs to be addressed.'}
        </p>
      </div>
    </div>
  );
}

BeforeAfterComparison.propTypes = {
  beforeImage: PropTypes.string,
  afterImage: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default BeforeAfterComparison;
