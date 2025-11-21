import { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Modal Component
 * Reusable modal dialog with backdrop
 */
function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-dark-surface rounded-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border'>
            {title && (
              <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text-primary'>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                aria-label='Close modal'
              >
                <svg
                  className='w-6 h-6'
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
            )}
          </div>
        )}

        {/* Content */}
        <div className='overflow-y-auto max-h-[calc(90vh-80px)]'>
          {children}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
};

export default Modal;
