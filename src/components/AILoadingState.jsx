import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function AILoadingState({ isLoading, onCancel }) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    'Analyzing your website with AI...',
    'Scanning for accessibility issues...',
    'Generating performance insights...',
    'Creating fix suggestions...',
    'Almost done, finalizing analysis...',
  ];

  useEffect(() => {
    if (!isLoading) {
      setTimeElapsed(0);
      setCurrentMessage(0);
      return;
    }

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    const messageTimer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  const isSlowResponse = timeElapsed > 15;

  return (
    <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center'>
      <div className='flex items-center justify-center mb-4'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3'></div>
        <div className='text-blue-600 dark:text-blue-400 font-medium'>
          AI Analysis in Progress
        </div>
      </div>

      <p className='text-blue-700 dark:text-blue-300 mb-4'>
        {messages[currentMessage]}
      </p>

      <div className='text-sm text-blue-600 dark:text-blue-400 mb-4'>
        Time elapsed: {Math.floor(timeElapsed / 60)}:
        {(timeElapsed % 60).toString().padStart(2, '0')}
      </div>

      {isSlowResponse && (
        <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4'>
          <div className='flex items-center justify-center mb-2'>
            <svg
              className='w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <span className='text-yellow-800 dark:text-yellow-200 font-medium'>
              Taking longer than expected
            </span>
          </div>
          <p className='text-yellow-700 dark:text-yellow-300 text-sm mb-3'>
            AI analysis is taking longer than usual. This might be due to:
          </p>
          <ul className='text-yellow-700 dark:text-yellow-300 text-sm text-left space-y-1 mb-4'>
            <li>• High server load on the AI service</li>
            <li>• Complex website requiring detailed analysis</li>
            <li>• Network connectivity issues</li>
          </ul>
          {onCancel && (
            <button
              onClick={onCancel}
              className='px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors'
            >
              Continue without AI analysis
            </button>
          )}
        </div>
      )}

      <div className='text-xs text-blue-500 dark:text-blue-400'>
        Using AI model: xAI Grok 4 Fast (Free tier may have delays)
      </div>
    </div>
  );
}

AILoadingState.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  onCancel: PropTypes.func,
};

export default AILoadingState;
