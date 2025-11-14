import { useState } from 'react';
import PropTypes from 'prop-types';

export default function ScreenshotGallery({ screenshots, onDownload }) {
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = (screenshot) => {
    setSelectedScreenshot(screenshot);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedScreenshot(null);
  };

  const handleDownload = (screenshot) => {
    if (onDownload) {
      onDownload(screenshot);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!screenshots || screenshots.length === 0) {
    return (
      <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
        <svg
          className='mx-auto h-12 w-12 text-gray-400'
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
        <p className='mt-2 text-sm text-gray-600'>No screenshots available</p>
      </div>
    );
  }

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {screenshots.map((screenshot, index) => (
          <div
            key={index}
            className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
          >
            {/* Screenshot Preview */}
            <div
              className='relative cursor-pointer group'
              onClick={() => openLightbox(screenshot)}
            >
              <img
                src={screenshot.screenshot}
                alt={screenshot.issue?.title || 'Screenshot'}
                className='w-full h-48 object-cover'
              />
              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center'>
                <svg
                  className='w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                  />
                </svg>
              </div>
              {screenshot.elementFound === false && (
                <div className='absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold'>
                  Element Not Found
                </div>
              )}
            </div>

            {/* Issue Details */}
            <div className='p-4'>
              <div className='flex items-start justify-between mb-2'>
                <h3 className='text-sm font-semibold text-gray-900 line-clamp-2'>
                  {screenshot.issue?.title || 'Untitled Issue'}
                </h3>
                {screenshot.issue?.severity && (
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                      screenshot.issue.severity
                    )}`}
                  >
                    {screenshot.issue.severity}
                  </span>
                )}
              </div>

              {screenshot.issue?.description && (
                <p className='text-xs text-gray-600 mb-3 line-clamp-2'>
                  {screenshot.issue.description}
                </p>
              )}

              {screenshot.issue?.selector && (
                <div className='mb-3'>
                  <code className='text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 block truncate'>
                    {screenshot.issue.selector}
                  </code>
                </div>
              )}

              {/* Actions */}
              <div className='flex gap-2'>
                <button
                  onClick={() => handleDownload(screenshot)}
                  className='flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2'
                >
                  <svg
                    className='w-4 h-4'
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
                  Download
                </button>
                <button
                  onClick={() => openLightbox(screenshot)}
                  className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors'
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && selectedScreenshot && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4'
          onClick={closeLightbox}
        >
          <div
            className='relative max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className='absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors'
            >
              <svg
                className='w-6 h-6 text-gray-700'
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

            {/* Image */}
            <div className='overflow-auto max-h-[70vh]'>
              <img
                src={selectedScreenshot.screenshot}
                alt={selectedScreenshot.issue?.title || 'Screenshot'}
                className='w-full h-auto'
              />
            </div>

            {/* Details */}
            <div className='p-6 border-t'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <h2 className='text-xl font-bold text-gray-900 mb-2'>
                    {selectedScreenshot.issue?.title || 'Untitled Issue'}
                  </h2>
                  {selectedScreenshot.issue?.description && (
                    <p className='text-gray-600 mb-3'>
                      {selectedScreenshot.issue.description}
                    </p>
                  )}
                  {selectedScreenshot.issue?.selector && (
                    <code className='text-sm bg-gray-100 px-3 py-2 rounded text-gray-700 block'>
                      {selectedScreenshot.issue.selector}
                    </code>
                  )}
                </div>
                {selectedScreenshot.issue?.severity && (
                  <span
                    className={`ml-4 px-3 py-1 text-sm font-medium rounded border ${getSeverityColor(
                      selectedScreenshot.issue.severity
                    )}`}
                  >
                    {selectedScreenshot.issue.severity}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDownload(selectedScreenshot)}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
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
                Download Screenshot
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

ScreenshotGallery.propTypes = {
  screenshots: PropTypes.arrayOf(
    PropTypes.shape({
      screenshot: PropTypes.string.isRequired,
      issue: PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        severity: PropTypes.string,
        selector: PropTypes.string,
      }),
      filename: PropTypes.string,
      elementFound: PropTypes.bool,
    })
  ),
  onDownload: PropTypes.func,
};
