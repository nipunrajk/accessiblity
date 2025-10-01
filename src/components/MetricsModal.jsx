import { useEffect } from 'react';
import PropTypes from 'prop-types';
import PerformanceMetrics from './ScoreCard/PerformanceMetrics';
import AccessibilityMetrics from './ScoreCard/AccessibilityMetrics';
import SEOMetrics from './ScoreCard/SEOMetrics';
import BestPracticesMetrics from './ScoreCard/BestPracticesMetrics';

function MetricsModal({ isOpen, onClose, category, data }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderMetrics = () => {
    switch (category) {
      case 'Performance':
        return <PerformanceMetrics data={data} />;
      case 'Accessibility':
        return <AccessibilityMetrics data={data} />;
      case 'SEO':
        return <SEOMetrics data={data} />;
      case 'Best Practices':
        return <BestPracticesMetrics data={data} />;
      default:
        return <div>No metrics available</div>;
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-dark-surface rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border'>
          <div className='flex items-center gap-3'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text-primary'>
              {category} Details
            </h2>
            <div className='text-2xl font-bold text-gray-900 dark:text-dark-text-primary'>
              {Math.round(data?.score || 0)}%
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
          >
            <svg
              className='w-5 h-5 text-gray-500 dark:text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
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

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          {data ? (
            renderMetrics()
          ) : (
            <div className='text-center py-8'>
              <p className='text-gray-500 dark:text-dark-text-muted'>
                No detailed metrics available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

MetricsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  category: PropTypes.string,
  data: PropTypes.object,
};

export default MetricsModal;
